const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 50 },
    description: { type: String, default: "", maxlength: 200 },
    icon: { type: String, default: "💬" },
    type: {
      type: String,
      enum: ["public", "private", "dm"],
      default: "public",
    },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    admins: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    lastMessage: {
      text: String,
      from: String,
      at: { type: Date, default: Date.now },
    },
    // For DMs: store both user IDs
    dmUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

// For DM rooms, create a unique key from two user IDs
roomSchema.statics.findOrCreateDM = async function (userId1, userId2) {
  const sorted = [userId1, userId2].sort();
  let room = await this.findOne({
    type: "dm",
    dmUsers: { $all: sorted, $size: 2 },
  });
  if (!room) {
    room = await this.create({
      name: "dm",
      type: "dm",
      dmUsers: sorted,
      members: sorted,
    });
  }
  return room;
};

module.exports = mongoose.model("Room", roomSchema);
