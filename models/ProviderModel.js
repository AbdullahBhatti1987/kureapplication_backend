// backend/models/Provider.js

const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  street: { type: String, required: true },
  street2: { type: String, required: false },
  state: { type: String, required: true },
  zip: { type: String, required: true }
});

const providerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  mobile: { type: String, required: true },
  password: { type: String, required: true },
  businessName: { type: String, required: true },
  businessType: { type: String, required: true },
  serviceCategory: { type: String, required: true },
  specialization: { type: String, required: true },
  licenseNumber: { type: String, required: true },
  yearsOfExperience: { type: String, required: true },
  address: addressSchema,
  certifications: [{
    name: String,
    issuingBody: String,
    year: Number
  }],
  education: [{
    degree: String,
    institution: String,
    year: Number
  }],
  services: [{
    name: String,
    description: String,
    price: Number
  }],
  insuranceAccepted: [String],
  languages: [String],
  isVerified: { type: Boolean, default: false },
  role: { type: String, default: 'provider' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Provider', providerSchema);
