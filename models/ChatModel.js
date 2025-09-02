const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  chatId: { type: String, required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "Provider    ", required: true },
  text: { type: String, required: true },
  time: { type: String },
  date: { type: String },
  status: { type: String, default: "pending" }, // pending, sent, delivered, read
});

module.exports = mongoose.model("Message", messageSchema);
