const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const { getProviderServices, getPaginatedServices, createService, getAllServices, getServiceById, updateService, deleteService, updateServiceStatus, uploadImage, getServiceCategories } = require("../controllers/serviceController");

// Upload image
router.post("/upload", protect, authorize("provider"), uploadImage);

// Get all services for a provider
router.get("/provider", protect, authorize("provider"), getProviderServices);

// Get all services by pagination (public)
router.get("/bypagination", getPaginatedServices);


router.get("/categories", getServiceCategories);
// Get all services (public)
router.get("/", getAllServices);

// Get single service
router.get("/:id", getServiceById);

// Create new service
router.post("/", protect, authorize("provider"), createService);

// Update service
router.put("/:id", protect, authorize("provider"), updateService);

// Update service status
router.patch("/:id/status", protect, authorize("provider"), updateServiceStatus);

// Delete service
router.delete("/:id", protect, authorize("provider"), deleteService);

module.exports = router;
