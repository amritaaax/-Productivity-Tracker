const mongoose = require("mongoose");

const dataSchema = new mongoose.Schema({
  hostname: { type: String, required: true },
  timeSpent: { type: Number, required: true },
  productivityType: {
    type: String,
    enum: ["productive", "distracting", "neutral"],
    default: "neutral",
  },
  date: {
    type: String,
    default: () => new Date().toISOString().split("T")[0],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("UserData", dataSchema);