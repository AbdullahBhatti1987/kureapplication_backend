const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  sender: {
    type: String,
    enum: ["user", "provider"],
    required: true
  },
  text: { type: String, default: "" },
  imageUrl: { type: String, default: null },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const chatSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: "Provider", required: true },
  messages: [messageSchema],
}, { timestamps: true });

chatSchema.index({ userId: 1, providerId: 1 }, { unique: true });

module.exports = mongoose.model("Chat", chatSchema);
