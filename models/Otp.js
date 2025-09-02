const mongoose = require('mongoose');
const otpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  purpose: { type: String, enum: ["register", "forgot-password"], required: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } }, 
});
module.exports = mongoose.model('Otp', otpSchema);