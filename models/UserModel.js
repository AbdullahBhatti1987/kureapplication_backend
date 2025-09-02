const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
  street: String,
  city: String,
  state: String,
  zip: String,
  // country: String,
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  mobile: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  address: addressSchema,
  role: { type: String, enum: ["user", "provider", "admin"], default: "user" },
  createdAt: { type: Date, default: Date.now },
});

// ✅ This line checks if 'User' is already defined in mongoose.models
module.exports = mongoose.models.User || mongoose.model("User", userSchema);
