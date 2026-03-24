const router = require("express").Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Room = require("../models/Room");
const { protect } = require("../middleware/auth");

const AVATAR_COLORS = [
  "#7C6FFF","#FF6B6B","#4ECDC4","#FFE66D",
  "#A78BFA","#FB923C","#34D399","#F472B6",
];

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ message: "All fields required" });

    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists)
      return res.status(400).json({
        message: exists.email === email ? "Email already in use" : "Username taken",
      });

    const color = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
    const user = await User.create({
      username,
      email,
      password,
      avatar: { color, initials: username.slice(0, 2).toUpperCase() },
    });

    // Auto-join general room
    const general = await Room.findOne({ name: "general", type: "public" });
    if (general) {
      general.members.addToSet(user._id);
      await general.save();
      user.rooms.push(general._id);
      await user.save();
    }

    res.status(201).json({ token: signToken(user._id), user: user.toPublic() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ message: "Invalid credentials" });

    res.json({ token: signToken(user._id), user: user.toPublic() });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/auth/me
router.get("/me", protect, (req, res) => {
  res.json({ user: req.user.toPublic() });
});

// GET /api/auth/users  — list all users (for DMs)
router.get("/users", protect, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select("username avatar status lastSeen")
      .lean();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
