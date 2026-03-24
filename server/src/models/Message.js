const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: { type: String, required: true, maxlength: 2000 },
    type: {
      type: String,
      enum: ["text", "system", "image"],
      default: "text",
    },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    edited: { type: Boolean, default: false },
    editedAt: Date,
    deleted: { type: Boolean, default: false },
    replyTo: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
    reactions: [
      {
        emoji: String,
        users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      },
    ],
  },
  { timestamps: true }
);

// Pagination helper
messageSchema.statics.getHistory = async function (roomId, before, limit = 40) {
  const query = { room: roomId, deleted: false };
  if (before) query.createdAt = { $lt: new Date(before) };
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("sender", "username avatar")
    .lean()
    .then((msgs) => msgs.reverse());
};

module.exports = mongoose.model("Message", messageSchema);
