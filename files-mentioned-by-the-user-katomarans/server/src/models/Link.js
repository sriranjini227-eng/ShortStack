const mongoose = require("mongoose");

const visitSchema = new mongoose.Schema(
  {
    visitedAt: {
      type: Date,
      default: Date.now
    },
    ip: String,
    userAgent: String,
    referrer: String
  },
  { _id: false }
);

const linkSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    originalUrl: {
      type: String,
      required: true,
      trim: true
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    clickCount: {
      type: Number,
      default: 0
    },
    visits: {
      type: [visitSchema],
      default: []
    },
    expiresAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Link", linkSchema);
