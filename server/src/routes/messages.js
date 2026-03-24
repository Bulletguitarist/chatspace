const router = require("express").Router();
const Message = require("../models/Message");
const { protect } = require("../middleware/auth");

// GET /api/messages/:roomId?before=<timestamp>&limit=40
router.get("/:roomId", protect, async (req, res) => {
  try {
    const { before, limit } = req.query;
    const messages = await Message.getHistory(
      req.params.roomId,
      before,
      parseInt(limit) || 40
    );
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
