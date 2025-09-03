const Service = require("../models/serviceModel");
const sendResponse = require("../helpers/sendResponse");
const cloudinary = require("cloudinary").v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// // Get all services for a user with pagination
// exports.getPaginatedServices = async (req, res) => {
//   const [total, services] = await Promise.all([
//   Service.countDocuments(categoryFilter),
//   Service.aggregate([
//     { $match: categoryFilter },
//     { $sort: { createdAt: -1 } },
//     { $skip: skip },
//     { $limit: limit },
//     {
//       $lookup: {
//         from: "users", // or "providers" if using separate collection
//         localField: "provider",
//         foreignField: "_id",
//         as: "provider",
//       },
//     },
//     { $unwind: "$provider" },
//   ]),
// ]);

//   try {
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const skip = (page - 1) * limit;

//     const categoryFilter = req.query.category && req.query.category !== 'all'
//       ? { category: req.query.category }
//       : {};
//     console.log("backend services data", categoryFilter)
//     const [total, services] = await Promise.all([
//       Service.countDocuments(categoryFilter),
//       Service.populate("provider", "name"),
//       Service.aggregate([

//         { $match: categoryFilter },
//         { $sort: { createdAt: -1 } },
//         { $skip: skip },
//         { $limit: limit },
//         {
//           $lookup: {
//             from: 'providers',
//             localField: 'provider',
//             foreignField: '_id',
//             as: 'provider'
//           }
//         },
//         { $unwind: '$provider' }
//       ])
//     ]);

//     res.status(200).json({
//       success: true,
//       page,
//       limit,
//       totalPages: Math.ceil(total / limit),
//       total,
//       services
//     });
//   } catch (error) {
//     console.error('Pagination Error:', error);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// };

// Get all services for a user with pagination
exports.getPaginatedServices = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const categoryFilter =
      req.query.category && req.query.category !== "all"
        ? { category: req.query.category }
        : {};

    console.log("backend services data", categoryFilter);

    const [total, services] = await Promise.all([
      Service.countDocuments(categoryFilter),
      Service.aggregate([
        { $match: categoryFilter },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
            from: "providers", // Ensure this is the correct collection name
            localField: "provider",
            foreignField: "_id",
            as: "provider",
          },
        },
        { $unwind: { path: "$provider", preserveNullAndEmptyArrays: true } },
      ]),
    ]);

    res.status(200).json({
      success: true,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      total,
      services,
    });
  } catch (error) {
    console.error("Pagination Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getServiceCategories = async (req, res) => {
  try {
    const categories = await Service.distinct("category");
    res.status(200).json({ categories });
  } catch (err) {
    console.error("Error fetching service categories:", err);
    res.status(500).json({ message: "Failed to fetch categories" });
  }
};

// Get all services for a provider
exports.getProviderServices = async (req, res) => {
  try {
    console.log("🔍 Backend: Fetching services for provider:", req.user.id);
    console.log("👤 User details:", { id: req.user.id, email: req.user.email });

    const services = await Service.find({ provider: req.user.id }).sort({
      createdAt: -1,
    });

    console.log("📦 Found services:", services.length);
    console.log(
      "📋 Services:",
      services.map((s) => ({ id: s._id, name: s.name, provider: s.provider }))
    );

    sendResponse(res, 200, true, "Services fetched successfully", { services });
  } catch (error) {
    console.error("❌ Error fetching provider services:", error);
    sendResponse(res, 500, false, "Failed to fetch services");
  }
};

// Get all services (public)
exports.getAllServices = async (req, res) => {
  try {
    const services = await Service.find({ status: "active" })
      .populate("provider", "name email mobile")
      .sort({ createdAt: -1 });

    sendResponse(res, 200, true, "Services fetched successfully", { services });
  } catch (error) {
    console.error("Error fetching services:", error);
    sendResponse(res, 500, false, "Failed to fetch services");
  }
};

// Get single service
exports.getServiceById = async (req, res) => {
  try {
    console.log("request", req.params)
    const service = await Service.findById(req.params.id).populate(
      "provider",
      "name email mobile"
    );

    if (!service) {
      return sendResponse(res, 404, false, "Service not found");
    }

    sendResponse(res, 200, true, "Service fetched successfully", { service });
  } catch (error) {
    console.error("Error fetching service:", error);
    sendResponse(res, 500, false, "Failed to fetch service");
  }
};

// Create new service
exports.createService = async (req, res) => {
  try {
    const { name, description, amount, category, image } = req.body;

    // Validate required fields
    if (!name || !description || !amount || !category || !image) {
      return sendResponse(res, 400, false, "All fields are required");
    }

    // Validate category
    const validCategories = [
      "hydration",
      "hydration1",
      "hydration2",
      "hydration3",
    ];
    if (!validCategories.includes(category)) {
      return sendResponse(res, 400, false, "Invalid category");
    }

    // Validate amount
    if (isNaN(amount) || parseFloat(amount) <= 0) {
      return sendResponse(res, 400, false, "Invalid amount");
    }

    // Validate image URL (should be a Cloudinary URL from frontend)
    if (!image.startsWith("http")) {
      return sendResponse(res, 400, false, "Invalid image URL");
    }

    const newService = new Service({
      name: name.trim(),
      description: description.trim(),
      amount: parseFloat(amount),
      category,
      image: image,
      provider: req.user.id,
      status: "active",
    });

    await newService.save();

    sendResponse(res, 201, true, "Service created successfully", {
      service: newService,
    });
  } catch (error) {
    console.error("Error creating service:", error);
    sendResponse(res, 500, false, "Failed to create service");
  }
};

// Update service
exports.updateService = async (req, res) => {
  try {
    const { name, description, amount, category, image } = req.body;

    const service = await Service.findById(req.params.id);

    if (!service) {
      return sendResponse(res, 404, false, "Service not found");
    }

    // Check if user owns this service
    if (service.provider.toString() !== req.user.id) {
      return sendResponse(
        res,
        403,
        false,
        "Not authorized to update this service"
      );
    }

    // Validate image URL if provided
    if (image && !image.startsWith("http")) {
      return sendResponse(res, 400, false, "Invalid image URL");
    }

    // Update fields
    if (name) service.name = name.trim();
    if (description) service.description = description.trim();
    if (amount) service.amount = parseFloat(amount);
    if (category) service.category = category;
    if (image) service.image = image;

    await service.save();

    sendResponse(res, 200, true, "Service updated successfully", { service });
  } catch (error) {
    console.error("Error updating service:", error);
    sendResponse(res, 500, false, "Failed to update service");
  }
};

// Update service status
exports.updateServiceStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["active", "inactive"].includes(status)) {
      return sendResponse(res, 400, false, "Invalid status");
    }

    const service = await Service.findById(req.params.id);

    if (!service) {
      return sendResponse(res, 404, false, "Service not found");
    }

    // Check if user owns this service
    if (service.provider.toString() !== req.user.id) {
      return sendResponse(
        res,
        403,
        false,
        "Not authorized to update this service"
      );
    }

    service.status = status;
    await service.save();

    sendResponse(
      res,
      200,
      true,
      `Service ${status === "active" ? "activated" : "paused"} successfully`,
      { service }
    );
  } catch (error) {
    console.error("Error updating service status:", error);
    sendResponse(res, 500, false, "Failed to update service status");
  }
};

// Delete service
exports.deleteService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return sendResponse(res, 404, false, "Service not found");
    }

    // Check if user owns this service
    if (service.provider.toString() !== req.user.id) {
      return sendResponse(
        res,
        403,
        false,
        "Not authorized to delete this service"
      );
    }

    await Service.findByIdAndDelete(req.params.id);

    sendResponse(res, 200, true, "Service deleted successfully");
  } catch (error) {
    console.error("Error deleting service:", error);
    sendResponse(res, 500, false, "Failed to delete service");
  }
};

// Upload image to Cloudinary
exports.uploadImage = async (req, res) => {
  try {
    const { image, folder = "services" } = req.body;

    if (!image) {
      return sendResponse(res, 400, false, "Image is required");
    }

    console.log("🖼️ Backend: Uploading image to Cloudinary...");
    console.log("📁 Folder:", folder);

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(image, {
      folder: `${process.env.CLOUDINARY_FOLDER || "Kure_Application"}/${folder}`,
      transformation: [
        { width: 1024, height: 768, crop: "fill", gravity: "center" },
        { quality: "auto", fetch_format: "auto" },
      ],
    });

    console.log("✅ Backend: Image uploaded to Cloudinary:", result.secure_url);

    sendResponse(res, 200, true, "Image uploaded successfully", {
      data: {
        imageUrl: result.secure_url,
        publicId: result.public_id,
      },
    });
  } catch (error) {
    console.error("Error uploading image:", error);
    sendResponse(res, 500, false, "Failed to upload image");
  }
};
