const router = require("express").Router();
const Room = require("../models/Room");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

// GET /api/rooms — get all public rooms + user's rooms
router.get("/", protect, async (req, res) => {
  try {
    const rooms = await Room.find({
      type: "public",
    })
      .select("name description icon members lastMessage type")
      .lean();
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/rooms — create a room
router.post("/", protect, async (req, res) => {
  try {
    const { name, description, icon, type } = req.body;
    if (!name) return res.status(400).json({ message: "Name required" });

    const room = await Room.create({
      name: name.toLowerCase().replace(/\s+/g, "-"),
      description,
      icon: icon || "💬",
      type: type || "public",
      members: [req.user._id],
      admins: [req.user._id],
      createdBy: req.user._id,
    });

    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { rooms: room._id },
    });

    res.status(201).json(room);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/rooms/:id/join
router.post("/:id/join", protect, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: "Room not found" });
    if (room.type !== "public")
      return res.status(403).json({ message: "Cannot join private room" });

    room.members.addToSet(req.user._id);
    await room.save();
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { rooms: room._id },
    });

    res.json(room);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/rooms/dm/:userId — open/get DM room
router.post("/dm/:userId", protect, async (req, res) => {
  try {
    const other = await User.findById(req.params.userId);
    if (!other) return res.status(404).json({ message: "User not found" });

    const room = await Room.findOrCreateDM(req.user._id, other._id);
    res.json({ room, otherUser: other.toPublic() });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Seed default rooms (called once on startup)
Room.findOne({ name: "general" }).then((r) => {
  if (!r) {
    Room.create([
      { name: "general",   description: "Open for everyone", icon: "🌐", type: "public" },
      { name: "tech-talk", description: "All things code",   icon: "💻", type: "public" },
      { name: "random",    description: "Anything goes",     icon: "🎲", type: "public" },
      { name: "music",     description: "Beats & vibes",     icon: "🎵", type: "public" },
    ]).then(() => console.log("✅ Default rooms seeded"));
  }
});

module.exports = router;
