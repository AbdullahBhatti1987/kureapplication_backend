const Appointment = require("../models/AppointmentModel");
const Service = require("../models/serviceModel");
const sendResponse = require("../helpers/sendResponse");

// Test route for debugging
exports.testAppointments = async (req, res) => {
  try {
    console.log('🧪 Test route called');
    console.log('👤 User ID from token:', req.user.id);
    console.log('🔑 User object:', req.user);
    
    // Get all appointments for this user
    const appointments = await Appointment.find({ userId: req.user.id })
      .populate('serviceId', 'name description amount category image')
      .populate('providerId', 'name email mobile')
      .sort({ createdAt: -1 });

    console.log('📋 Found appointments:', appointments.length);
    console.log('📄 Appointments data:', appointments);

    res.json({
      success: true,
      message: "Test route working",
      user: {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name
      },
      appointmentsCount: appointments.length,
      appointments: appointments
    });
  } catch (error) {
    console.error("❌ Test route error:", error);
    res.status(500).json({
      success: false,
      message: "Test route failed",
      error: error.message
    });
  }
};

// Create new appointment
exports.createAppointment = async (req, res) => {
  try {
    console.log('🔍 Creating appointment with data:', req.body);
    console.log('👤 User ID:', req.user.id);
    
    const {
      serviceId,
      providerId,
      appointmentDate,
      appointmentTime,
      address,
      latitude,
      longitude,
      notes,
      amount
    } = req.body;

    // Validate required fields
    if (!serviceId || !providerId || !appointmentDate || !appointmentTime || !address || !amount) {
      console.log('❌ Missing required fields:', { serviceId, providerId, appointmentDate, appointmentTime, address, amount });
      return sendResponse(res, 400, false, "Missing required fields");
    }

    // Check if service exists
    const service = await Service.findById(serviceId);
    if (!service) {
      console.log('❌ Service not found:', serviceId);
      return sendResponse(res, 404, false, "Service not found");
    }

    console.log('✅ Service found:', service.name);

    // Create new appointment
    const newAppointment = new Appointment({
      serviceId,
      providerId,
      userId: req.user.id,
      appointmentDate,
      appointmentTime,
      address,
      latitude: latitude || null,
      longitude: longitude || null,
      notes: notes || '',
      amount: parseFloat(amount),
      status: 'pending',
      paymentStatus: 'pending'
    });

    await newAppointment.save();

    // Populate service and provider details
    await newAppointment.populate([
      { path: 'serviceId', select: 'name description amount category image' },
      { path: 'providerId', select: 'name email mobile' },
      { path: 'userId', select: 'name email mobile' }
    ]);

    console.log('✅ Appointment created successfully:', newAppointment._id);

    sendResponse(res, 201, true, "Appointment created successfully", { 
      appointment: newAppointment 
    });
  } catch (error) {
    console.error("❌ Error creating appointment:", error);
    sendResponse(res, 500, false, "Failed to create appointment");
  }
};

// Get user appointments
exports.getUserAppointments = async (req, res) => {
  try {
    console.log('🔍 Getting appointments for user:', req.user.id);
    // console.log('👤 User object:', req.user);
    
    const appointments = await Appointment.find({ userId: req.user.id })
      .populate('serviceId', 'name description amount category image')
      .populate('providerId', 'name email mobile')
      .sort({ createdAt: -1 });

    // console.log('📋 Found appointments:', appointments.length);
    // console.log('📄 Appointments data:', appointments);

    // Return same structure as test route
    res.json({
      success: true,
      message: "Appointments fetched successfully",
      data: {
        appointments: appointments
      }
    });
  } catch (error) {
    console.error("❌ Error fetching user appointments:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch appointments",
      error: error.message
    });
  }
};

// Get provider appointments with aggregation and filtering
exports.getProviderAppointments = async (req, res) => {
  try {
    console.log('🔍 Getting appointments for provider:', req.user.id);
    // console.log('👤 Provider object:', req.user);
    
    const { 
      fromDate, 
      toDate, 
      status, 
      page = 1, 
      limit = 50,
      sortBy = 'appointmentDate',
      sortOrder = 'asc'
    } = req.query;

    // Build match conditions
    const matchConditions = {
      providerId: req.user.id
    };

    // Add date range filter if provided
    if (fromDate || toDate) {
      matchConditions.appointmentDate = {};
      if (fromDate) {
        matchConditions.appointmentDate.$gte = fromDate;
      }
      if (toDate) {
        matchConditions.appointmentDate.$lte = toDate;
      }
    }

    // Add status filter if provided
    if (status && status !== 'All' && status !== '') {
      if (status === 'Current') {
        matchConditions.status = { $in: ['pending', 'confirmed'] };
      } else {
        matchConditions.status = status.toLowerCase();
      }
    }

    console.log('🔍 Match conditions:', matchConditions);

    // Calculate skip value for pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build sort object
    const sortObject = {};
    sortObject[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Aggregation pipeline
    const pipeline = [
      // Match appointments for this provider with filters
      { $match: matchConditions },
      
      // Lookup service details
      {
        $lookup: {
          from: 'services',
          localField: 'serviceId',
          foreignField: '_id',
          as: 'serviceId'
        }
      },
      
      // Lookup user details
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'userId'
        }
      },
      
      // Unwind the arrays
      { $unwind: { path: '$serviceId', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$userId', preserveNullAndEmptyArrays: true } },
      
      // Project only needed fields
      {
        $project: {
          _id: 1,
          appointmentDate: 1,
          appointmentTime: 1,
          address: 1,
          notes: 1,
          amount: 1,
          status: 1,
          paymentStatus: 1,
          createdAt: 1,
          updatedAt: 1,
          'serviceId._id': 1,
          'serviceId.name': 1,
          'serviceId.description': 1,
          'serviceId.amount': 1,
          'serviceId.category': 1,
          'serviceId.image': 1,
          'userId._id': 1,
          'userId.name': 1,
          'userId.email': 1,
          'userId.mobile': 1
        }
      },
      
      // Sort the results
      { $sort: sortObject },
      
      // Skip for pagination
      { $skip: skip },
      
      // Limit results
      { $limit: parseInt(limit) }
    ];

    // Get total count for pagination
    const countPipeline = [
      { $match: matchConditions },
      { $count: 'total' }
    ];

    // Execute both queries
    const [appointments, countResult] = await Promise.all([
      Appointment.aggregate(pipeline),
      Appointment.aggregate(countPipeline)
    ]);

    const totalCount = countResult.length > 0 ? countResult[0].total : 0;
    const totalPages = Math.ceil(totalCount / parseInt(limit));

    // Calculate statistics
    const statsPipeline = [
      { $match: { providerId: req.user.id } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          confirmed: {
            $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] }
          },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          cancelled: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          }
        }
      }
    ];

    const statsResult = await Appointment.aggregate(statsPipeline);
    const stats = statsResult.length > 0 ? statsResult[0] : {
      total: 0,
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0
    };

    console.log('📋 Found appointments:', appointments.length);
    console.log('📊 Statistics:', stats);
    console.log('📄 Appointments data:', appointments);

    sendResponse(res, 200, true, "Provider appointments fetched successfully", {
      appointments,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalCount,
        limit: parseInt(limit)
      },
      statistics: stats,
      filters: {
        fromDate,
        toDate,
        status
      }
    });
  } catch (error) {
    console.error("❌ Error fetching provider appointments:", error);
    sendResponse(res, 500, false, "Failed to fetch provider appointments");
  }
};

// Get single appointment
exports.getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('serviceId', 'name description amount category image')
      .populate('providerId', 'name email mobile')
      .populate('userId', 'name email mobile');

    if (!appointment) {
      return sendResponse(res, 404, false, "Appointment not found");
    }

    // Check if user has access to this appointment
    if (appointment.userId._id.toString() !== req.user.id && 
        appointment.providerId._id.toString() !== req.user.id) {
      return sendResponse(res, 403, false, "Not authorized to view this appointment");
    }

    sendResponse(res, 200, true, "Appointment fetched successfully", { appointment });
  } catch (error) {
    console.error("Error fetching appointment:", error);
    sendResponse(res, 500, false, "Failed to fetch appointment");
  }
};

// Update appointment status
exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
      return sendResponse(res, 400, false, "Invalid status");
    }

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return sendResponse(res, 404, false, "Appointment not found");
    }

    // Check if user is the provider of this appointment
    if (appointment.providerId.toString() !== req.user.id) {
      return sendResponse(res, 403, false, "Not authorized to update this appointment");
    }

    appointment.status = status;
    await appointment.save();

    sendResponse(res, 200, true, "Appointment status updated successfully", { appointment });
  } catch (error) {
    console.error("Error updating appointment status:", error);
    sendResponse(res, 500, false, "Failed to update appointment status");
  }
};

// Cancel appointment (user can cancel their own appointment)
exports.cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return sendResponse(res, 404, false, "Appointment not found");
    }

    // Check if user owns this appointment
    if (appointment.userId.toString() !== req.user.id) {
      return sendResponse(res, 403, false, "Not authorized to cancel this appointment");
    }

    // Only allow cancellation if appointment is still pending or confirmed
    if (!['pending', 'confirmed'].includes(appointment.status)) {
      return sendResponse(res, 400, false, "Cannot cancel appointment in current status");
    }

    appointment.status = 'cancelled';
    await appointment.save();

    sendResponse(res, 200, true, "Appointment cancelled successfully", { appointment });
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    sendResponse(res, 500, false, "Failed to cancel appointment");
  }
}; 