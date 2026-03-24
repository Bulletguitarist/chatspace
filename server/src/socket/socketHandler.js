const { socketAuth } = require("../middleware/auth");
const Message = require("../models/Message");
const Room = require("../models/Room");
const User = require("../models/User");

// Track online users: userId -> { socketId, username, avatar }
const onlineUsers = new Map();

function initSocket(io) {
  // ── Auth middleware ──────────────────────────────────────────────────────────
  io.use(socketAuth);

  io.on("connection", async (socket) => {
    const user = socket.user;
    console.log(`✅ ${user.username} connected [${socket.id}]`);

    // Mark online
    onlineUsers.set(user._id.toString(), {
      socketId: socket.id,
      username: user.username,
      avatar: user.avatar,
      status: "online",
    });
    await User.findByIdAndUpdate(user._id, { status: "online" });

    // Broadcast updated online list to everyone
    io.emit("users:online", Array.from(onlineUsers.entries()).map(([id, u]) => ({ _id: id, ...u })));

    // ── Join rooms ─────────────────────────────────────────────────────────────
    socket.on("rooms:join", async (roomIds) => {
      if (!Array.isArray(roomIds)) return;
      roomIds.forEach((id) => socket.join(id));
      console.log(`${user.username} joined rooms: ${roomIds.join(", ")}`);
    });

    // ── Send message ───────────────────────────────────────────────────────────
    socket.on("message:send", async ({ roomId, text, replyTo }) => {
      try {
        if (!text?.trim() || !roomId) return;

        const msg = await Message.create({
          room: roomId,
          sender: user._id,
          text: text.trim(),
          replyTo: replyTo || null,
        });

        const populated = await msg.populate("sender", "username avatar");

        // Update room's last message
        await Room.findByIdAndUpdate(roomId, {
          lastMessage: { text: text.trim(), from: user.username, at: new Date() },
        });

        // Broadcast to everyone in the room (including sender)
        io.to(roomId).emit("message:new", populated);
      } catch (err) {
        console.error("message:send error", err);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // ── Typing indicators ──────────────────────────────────────────────────────
    socket.on("typing:start", ({ roomId }) => {
      socket.to(roomId).emit("typing:start", {
        userId: user._id,
        username: user.username,
        roomId,
      });
    });

    socket.on("typing:stop", ({ roomId }) => {
      socket.to(roomId).emit("typing:stop", {
        userId: user._id,
        roomId,
      });
    });

    // ── Message reactions ──────────────────────────────────────────────────────
    socket.on("message:react", async ({ messageId, emoji, roomId }) => {
      try {
        const msg = await Message.findById(messageId);
        if (!msg) return;

        const reaction = msg.reactions.find((r) => r.emoji === emoji);
        if (reaction) {
          const idx = reaction.users.indexOf(user._id);
          if (idx >= 0) reaction.users.splice(idx, 1);
          else reaction.users.push(user._id);
          if (reaction.users.length === 0)
            msg.reactions = msg.reactions.filter((r) => r.emoji !== emoji);
        } else {
          msg.reactions.push({ emoji, users: [user._id] });
        }
        await msg.save();

        io.to(roomId).emit("message:reacted", {
          messageId,
          reactions: msg.reactions,
        });
      } catch (err) {
        console.error("react error", err);
      }
    });

    // ── Edit message ───────────────────────────────────────────────────────────
    socket.on("message:edit", async ({ messageId, text, roomId }) => {
      try {
        const msg = await Message.findOne({ _id: messageId, sender: user._id });
        if (!msg) return;
        msg.text = text.trim();
        msg.edited = true;
        msg.editedAt = new Date();
        await msg.save();
        io.to(roomId).emit("message:edited", { messageId, text: msg.text, editedAt: msg.editedAt });
      } catch (err) {
        console.error("edit error", err);
      }
    });

    // ── Delete message ─────────────────────────────────────────────────────────
    socket.on("message:delete", async ({ messageId, roomId }) => {
      try {
        const msg = await Message.findOne({ _id: messageId, sender: user._id });
        if (!msg) return;
        msg.deleted = true;
        await msg.save();
        io.to(roomId).emit("message:deleted", { messageId });
      } catch (err) {
        console.error("delete error", err);
      }
    });

    // ── Status change ──────────────────────────────────────────────────────────
    socket.on("status:change", async ({ status }) => {
      if (!["online", "away"].includes(status)) return;
      onlineUsers.get(user._id.toString()) &&
        (onlineUsers.get(user._id.toString()).status = status);
      await User.findByIdAndUpdate(user._id, { status });
      io.emit("users:online", Array.from(onlineUsers.entries()).map(([id, u]) => ({ _id: id, ...u })));
    });

    // ── Disconnect ─────────────────────────────────────────────────────────────
    socket.on("disconnect", async () => {
      console.log(`❌ ${user.username} disconnected`);
      onlineUsers.delete(user._id.toString());
      await User.findByIdAndUpdate(user._id, {
        status: "offline",
        lastSeen: new Date(),
      });
      io.emit("users:online", Array.from(onlineUsers.entries()).map(([id, u]) => ({ _id: id, ...u })));
    });
  });
}

module.exports = { initSocket };
