const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const Provider = require("../models/ProviderModel");
const {getProviderStats, getTodayAppointments, getWeeklyAppointments, getMonthlyAppointments, getAllProviderAppointments, getAllAppointmentsByProvider, testAllAppointments  } = require("../controllers/providerController");

// Get provider statistics
router.get("/stats", protect, authorize("provider"), getProviderStats);

// Get today's appointments
router.get("/today-appointments", protect, authorize("provider"), getTodayAppointments);

// Get weekly appointments from last 7 days
router.get("/weekly-appointments", protect, authorize("provider"), getWeeklyAppointments);

// Get monthly appointments
router.get("/monthly-appointments", protect, authorize("provider"), getMonthlyAppointments);

// Get all provider appointments with filtering
router.get("/all-appointments", protect, getAllProviderAppointments);

// Simple route to get all appointments by provider
router.get("/get-all-appointments", protect, getAllAppointmentsByProvider);

// Test route for all appointments
router.get("/all-appointments-test", protect, testAllAppointments);

// Test route for debugging
router.get("/test", protect, authorize("provider"), (req, res) => {
  res.json({
    success: true,
    message: "Provider routes are working",
    user: req.user
  });
});

// Get all providers
router.get("/", async (req, res) => {
  try {
    const providers = await Provider.find().select("-password");
    res.status(200).json({
      success: true,
      providers
    });
  } catch (error) {
    console.error("Get providers error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching providers"
    });
  }
});

// Get provider by ID
router.get("/:id", async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.id).select("-password");
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider not found"
      });
    }
    res.status(200).json({
      success: true,
      provider
    });
  } catch (error) {
    console.error("Get provider error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching provider"
    });
  }
});

// Update provider profile
router.put("/profile", protect, authorize("provider"), async (req, res) => {
  try {
    const provider = await Provider.findById(req.user.id);
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider not found"
      });
    }

    const { name, email, businessName, businessType, serviceCategory, specialization, 
            licenseNumber, yearsOfExperience, address, certifications, education, 
            services, insuranceAccepted, languages } = req.body;

    // Update fields if provided
    if (name) provider.name = name;
    if (email) provider.email = email;
    if (businessName) provider.businessName = businessName;
    if (businessType) provider.businessType = businessType;
    if (serviceCategory) provider.serviceCategory = serviceCategory;
    if (specialization) provider.specialization = specialization;
    if (licenseNumber) provider.licenseNumber = licenseNumber;
    if (yearsOfExperience) provider.yearsOfExperience = yearsOfExperience;
    if (address) provider.address = address;
    if (certifications) provider.certifications = certifications;
    if (education) provider.education = education;
    if (services) provider.services = services;
    if (insuranceAccepted) provider.insuranceAccepted = insuranceAccepted;
    if (languages) provider.languages = languages;

    await provider.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      provider: {
        id: provider._id,
        name: provider.name,
        email: provider.email,
        businessName: provider.businessName,
        role: provider.role
      }
    });
  } catch (error) {
    console.error("Update provider error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating profile"
    });
  }
});

// Delete provider
router.delete("/:id", protect, authorize("provider"), async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.id);
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider not found"
      });
    }

    await provider.deleteOne();

    res.status(200).json({
      success: true,
      message: "Provider deleted successfully"
    });
  } catch (error) {
    console.error("Delete provider error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting provider"
    });
  }
});

module.exports = router; 