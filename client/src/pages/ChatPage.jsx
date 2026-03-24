import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../hooks/useSocket";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import MembersPanel from "../components/MembersPanel";

const API = import.meta.env.VITE_API_URL || "";

export default function ChatPage() {
  const { user, token, logout } = useAuth();
  const { socket, connected } = useSocket(token);

  const [rooms, setRooms] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);   // { _id, name, icon, type, dmUsers }
  const [messages, setMessages] = useState({});          // roomId -> []
  const [typingUsers, setTypingUsers] = useState({});    // roomId -> Set of usernames
  const [unread, setUnread] = useState({});              // roomId -> count
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  // ── Load rooms & users on mount ─────────────────────────────────────────────
  useEffect(() => {
    axios.get(`${API}/api/rooms`).then(({ data }) => {
      setRooms(data);
      if (data.length > 0) openRoom(data[0]);
    });
    axios.get(`${API}/api/auth/users`).then(({ data }) => setAllUsers(data));
  }, []);

  // ── Socket events ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    socket.on("users:online", (users) => setOnlineUsers(users));

    socket.on("message:new", (msg) => {
      const rid = msg.room;
      setMessages((prev) => ({
        ...prev,
        [rid]: [...(prev[rid] || []), msg],
      }));
      setActiveRoom((cur) => {
        if (!cur || cur._id !== rid) {
          setUnread((u) => ({ ...u, [rid]: (u[rid] || 0) + 1 }));
        }
        return cur;
      });
    });

    socket.on("typing:start", ({ userId, username, roomId }) => {
      if (userId === user._id) return;
      setTypingUsers((prev) => {
        const set = new Set(prev[roomId] || []);
        set.add(username);
        return { ...prev, [roomId]: set };
      });
    });

    socket.on("typing:stop", ({ userId, roomId }) => {
      setTypingUsers((prev) => {
        const entry = prev[roomId];
        if (!entry) return prev;
        // find username by userId from allUsers
        const found = [...entry].find((name) =>
          allUsers.find((u) => u._id === userId && u.username === name)
        );
        if (!found) return prev;
        const set = new Set(entry);
        set.delete(found);
        return { ...prev, [roomId]: set };
      });
    });

    socket.on("message:edited", ({ messageId, text, editedAt }) => {
      setMessages((prev) =>
        Object.fromEntries(
          Object.entries(prev).map(([rid, msgs]) => [
            rid,
            msgs.map((m) => (m._id === messageId ? { ...m, text, edited: true, editedAt } : m)),
          ])
        )
      );
    });

    socket.on("message:deleted", ({ messageId }) => {
      setMessages((prev) =>
        Object.fromEntries(
          Object.entries(prev).map(([rid, msgs]) => [
            rid,
            msgs.map((m) => (m._id === messageId ? { ...m, deleted: true } : m)),
          ])
        )
      );
    });

    socket.on("message:reacted", ({ messageId, reactions }) => {
      setMessages((prev) =>
        Object.fromEntries(
          Object.entries(prev).map(([rid, msgs]) => [
            rid,
            msgs.map((m) => (m._id === messageId ? { ...m, reactions } : m)),
          ])
        )
      );
    });

    return () => {
      socket.off("users:online");
      socket.off("message:new");
      socket.off("typing:start");
      socket.off("typing:stop");
      socket.off("message:edited");
      socket.off("message:deleted");
      socket.off("message:reacted");
    };
  }, [socket, allUsers, user._id]);

  // ── Join all room sockets when rooms load ───────────────────────────────────
  useEffect(() => {
    if (!socket || rooms.length === 0) return;
    socket.emit("rooms:join", rooms.map((r) => r._id));
  }, [socket, rooms]);

  // ── Open a channel room ─────────────────────────────────────────────────────
  const openRoom = useCallback(async (room) => {
    setActiveRoom(room);
    setUnread((u) => { const n = { ...u }; delete n[room._id]; return n; });
    if (!messages[room._id]) {
      setLoadingMsgs(true);
      try {
        const { data } = await axios.get(`${API}/api/messages/${room._id}`);
        setMessages((prev) => ({ ...prev, [room._id]: data }));
      } finally {
        setLoadingMsgs(false);
      }
    }
  }, [messages]);

  // ── Open a DM ───────────────────────────────────────────────────────────────
  const openDm = useCallback(async (otherUserId) => {
    const { data } = await axios.post(`${API}/api/rooms/dm/${otherUserId}`);
    const { room } = data;
    // Join the DM socket room
    socket?.emit("rooms:join", [room._id]);
    setActiveRoom(room);
    setUnread((u) => { const n = { ...u }; delete n[room._id]; return n; });
    if (!messages[room._id]) {
      const { data: msgs } = await axios.get(`${API}/api/messages/${room._id}`);
      setMessages((prev) => ({ ...prev, [room._id]: msgs }));
    }
  }, [socket, messages]);

  // ── Send message ────────────────────────────────────────────────────────────
  const sendMessage = useCallback((text, replyTo) => {
    if (!socket || !activeRoom || !text.trim()) return;
    socket.emit("message:send", { roomId: activeRoom._id, text, replyTo });
  }, [socket, activeRoom]);

  // ── Typing ──────────────────────────────────────────────────────────────────
  const sendTyping = useCallback((isTyping) => {
    if (!socket || !activeRoom) return;
    socket.emit(isTyping ? "typing:start" : "typing:stop", { roomId: activeRoom._id });
  }, [socket, activeRoom]);

  // ── React to message ────────────────────────────────────────────────────────
  const reactToMessage = useCallback((messageId, emoji) => {
    if (!socket || !activeRoom) return;
    socket.emit("message:react", { messageId, emoji, roomId: activeRoom._id });
  }, [socket, activeRoom]);

  const editMessage = useCallback((messageId, text) => {
    if (!socket || !activeRoom) return;
    socket.emit("message:edit", { messageId, text, roomId: activeRoom._id });
  }, [socket, activeRoom]);

  const deleteMessage = useCallback((messageId) => {
    if (!socket || !activeRoom) return;
    socket.emit("message:delete", { messageId, roomId: activeRoom._id });
  }, [socket, activeRoom]);

  const activeMessages = activeRoom ? (messages[activeRoom._id] || []) : [];
  const activeTyping = activeRoom ? (typingUsers[activeRoom._id] || new Set()) : new Set();

  return (
    <div style={{ display: "grid", gridTemplateColumns: "72px 240px 1fr 260px", height: "100vh", overflow: "hidden" }}>
      <Sidebar
        rooms={rooms}
        allUsers={allUsers}
        onlineUsers={onlineUsers}
        activeRoom={activeRoom}
        unread={unread}
        onSelectRoom={openRoom}
        onSelectDm={openDm}
        onLogout={logout}
        user={user}
        connected={connected}
        onCreateRoom={async (name, desc, icon) => {
          const { data } = await axios.post(`${API}/api/rooms`, { name, description: desc, icon });
          setRooms((prev) => [...prev, data]);
          socket?.emit("rooms:join", [data._id]);
          openRoom(data);
        }}
      />
      <ChatWindow
        activeRoom={activeRoom}
        messages={activeMessages}
        user={user}
        typingUsers={activeTyping}
        loading={loadingMsgs}
        allUsers={allUsers}
        onlineUsers={onlineUsers}
        onSend={sendMessage}
        onTyping={sendTyping}
        onReact={reactToMessage}
        onEdit={editMessage}
        onDelete={deleteMessage}
      />
      <MembersPanel
        activeRoom={activeRoom}
        allUsers={allUsers}
        onlineUsers={onlineUsers}
        user={user}
        onOpenDm={openDm}
        messages={activeMessages}
      />
    </div>
  );
}
