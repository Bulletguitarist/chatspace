const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 2,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    avatar: {
      color: { type: String, default: "#7C6FFF" },
      initials: { type: String, default: "" },
    },
    status: {
      type: String,
      enum: ["online", "away", "offline"],
      default: "offline",
    },
    lastSeen: { type: Date, default: Date.now },
    rooms: [{ type: mongoose.Schema.Types.ObjectId, ref: "Room" }],
  },
  { timestamps: true }
);

// Hash password before save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  // Auto-set initials from username
  this.avatar.initials = this.username.slice(0, 2).toUpperCase();
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toPublic = function () {
  return {
    _id: this._id,
    username: this.username,
    avatar: this.avatar,
    status: this.status,
    lastSeen: this.lastSeen,
  };
};

module.exports = mongoose.model("User", userSchema);
