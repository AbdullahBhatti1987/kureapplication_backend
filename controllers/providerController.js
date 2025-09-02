// backend/controllers/providerController.js
const Provider = require("../models/ProviderModel");
const Service = require("../models/serviceModel");
const Appointment = require("../models/AppointmentModel");
const sendResponse = require("../helpers/sendResponse");
const mongoose = require("mongoose");

// Get provider statistics
exports.getProviderStats = async (req, res) => {
  try {
    console.log('🔍 Getting provider stats for:', req.user.id);
    console.log('👤 User object:', req.user);
    
    const providerId = req.user.id;
    
    // Get services count
    const servicesCount = await Service.countDocuments({ provider: providerId });
    console.log('📊 Services count:', servicesCount);
    
    // Get active services count (assuming services have a status field, if not we'll use total)
    const activeServicesCount = await Service.countDocuments({ 
      provider: providerId,
      status: 'active'
    });
    console.log('📊 Active services count:', activeServicesCount);
    
    // Get appointments count for today
    const today = new Date().toISOString().slice(0, 10);
    const todayAppointments = await Appointment.countDocuments({
      providerId: providerId,
      appointmentDate: today
    });
    console.log('📅 Today appointments count:', todayAppointments);
    
    // Get unique clients count
    const uniqueClients = await Appointment.distinct('userId', { providerId: providerId });
    const clientsCount = uniqueClients.length;
    console.log('👥 Unique clients count:', clientsCount);
    
    // Get clients with completed appointments
    const completedClients = await Appointment.distinct('userId', { 
      providerId: providerId,
      status: { $in: ['completed', 'done'] }
    });
    const completedClientsCount = completedClients.length;
    console.log('👥 Clients with completed appointments:', completedClientsCount);
    
    // Get active clients count (clients who have appointments in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const activeClients = await Appointment.distinct('userId', { 
      providerId: providerId,
      createdAt: { $gte: thirtyDaysAgo }
    });
    const activeClientsCount = activeClients.length;
    console.log('👥 Active clients count:', activeClientsCount);
    
    const responseData = {
      stats: {
        servicesCount,
        activeServices: activeServicesCount,
        appointmentsCount: todayAppointments,
        clientsCount,
        activeClients: activeClientsCount,
        completedClients: completedClientsCount
      }
    };
    
    console.log('📤 Sending response:', responseData);
    
    sendResponse(res, 200, true, "Provider statistics fetched successfully", responseData);
  } catch (error) {
    console.error("❌ Error fetching provider stats:", error);
    sendResponse(res, 500, false, "Failed to fetch provider statistics");
  }
};

// Get weekly appointments from last 7 days using aggregation
exports.getWeeklyAppointments = async (req, res) => {
  try {
    console.log('🔍 Getting weekly appointments for provider:', req.user.id);
    
    const providerId = req.user.id;
    
    // Calculate date 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    console.log('📅 Seven days ago date:', sevenDaysAgo);
    
    // Use aggregation to get appointments from last 7 days
    const weeklyAppointments = await Appointment.aggregate([
      {
        $match: {
          providerId: new mongoose.Types.ObjectId(providerId),
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      {
        $lookup: {
          from: 'services',
          localField: 'serviceId',
          foreignField: '_id',
          as: 'serviceDetails'
        }
      },
      {
        $unwind: '$userDetails'
      },
      {
        $unwind: '$serviceDetails'
      },
      {
        $project: {
          _id: 1,
          appointmentDate: 1,
          appointmentTime: 1,
          status: 1,
          amount: 1,
          createdAt: 1,
          'userDetails.name': 1,
          'userDetails.email': 1,
          'serviceDetails.name': 1,
          'serviceDetails.description': 1
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $limit: 10
      }
    ]);
    
    console.log('📋 Found weekly appointments:', weeklyAppointments.length);
    
    // Transform the data to match the expected format
    const transformedAppointments = weeklyAppointments.map(appointment => ({
      _id: appointment._id,
      appointmentDate: appointment.appointmentDate,
      appointmentTime: appointment.appointmentTime,
      status: appointment.status,
      amount: appointment.amount,
      createdAt: appointment.createdAt,
      userId: {
        name: appointment.userDetails.name,
        email: appointment.userDetails.email
      },
      serviceId: {
        name: appointment.serviceDetails.name,
        description: appointment.serviceDetails.description
      }
    }));
    
    console.log('📤 Sending weekly appointments response');
    
    sendResponse(res, 200, true, "Weekly appointments fetched successfully", {
      weeklyAppointments: transformedAppointments
    });
  } catch (error) {
    console.error("❌ Error fetching weekly appointments:", error);
    sendResponse(res, 500, false, "Failed to fetch weekly appointments");
  }
};

// Get today's appointments using aggregation
exports.getTodayAppointments = async (req, res) => {
  try {
    console.log('🔍 Getting today\'s appointments for provider:', req.user.id);
    
    const providerId = req.user.id;
    const today = new Date().toISOString().slice(0, 10);
    
    console.log('📅 Today\'s date:', today);
    
    // First, let's check what appointments exist for this provider
    const allProviderAppointments = await Appointment.find({ providerId: providerId }).limit(5);
    console.log('🔍 Sample appointments for provider:', allProviderAppointments.map(apt => ({
      appointmentDate: apt.appointmentDate,
      status: apt.status,
      createdAt: apt.createdAt
    })));
    
    // Use aggregation to get today's appointments with stats
    const todayStats = await Appointment.aggregate([
      {
        $match: {
          providerId: new mongoose.Types.ObjectId(providerId),
          appointmentDate: today
        }
      },
      {
        $group: {
          _id: null,
          totalAppointments: { $sum: 1 },
          completedAppointments: {
            $sum: {
              $cond: [
                { $in: ['$status', ['completed', 'done']] },
                1,
                0
              ]
            }
          },
          pendingAppointments: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'pending'] },
                1,
                0
              ]
            }
          },
          confirmedAppointments: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'confirmed'] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);
    
    console.log('📊 Today stats from aggregation:', todayStats);
    
    // Also try to get appointments created today (as a fallback)
    const todayCreatedStats = await Appointment.aggregate([
      {
        $match: {
          providerId: new mongoose.Types.ObjectId(providerId),
          createdAt: {
            $gte: new Date(new Date().setHours(0, 0, 0, 0)),
            $lt: new Date(new Date().setHours(23, 59, 59, 999))
          }
        }
      },
      {
        $group: {
          _id: null,
          totalAppointments: { $sum: 1 },
          completedAppointments: {
            $sum: {
              $cond: [
                { $in: ['$status', ['completed', 'done']] },
                1,
                0
              ]
            }
          },
          pendingAppointments: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'pending'] },
                1,
                0
              ]
            }
          },
          confirmedAppointments: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'confirmed'] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);
    
    console.log('📊 Today created stats from aggregation:', todayCreatedStats);
    
    // Get detailed appointments for today
    const todayAppointments = await Appointment.aggregate([
      {
        $match: {
          providerId: new mongoose.Types.ObjectId(providerId),
          appointmentDate: today
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      {
        $lookup: {
          from: 'services',
          localField: 'serviceId',
          foreignField: '_id',
          as: 'serviceDetails'
        }
      },
      {
        $unwind: '$userDetails'
      },
      {
        $unwind: '$serviceDetails'
      },
      {
        $project: {
          _id: 1,
          appointmentDate: 1,
          appointmentTime: 1,
          status: 1,
          amount: 1,
          createdAt: 1,
          'userDetails.name': 1,
          'userDetails.email': 1,
          'serviceDetails.name': 1,
          'serviceDetails.description': 1
        }
      },
      {
        $sort: { appointmentTime: 1 }
      }
    ]);
    
    // Use the first available stats (either by appointmentDate or createdAt)
    const stats = todayStats[0] || todayCreatedStats[0] || {
      totalAppointments: 0,
      completedAppointments: 0,
      pendingAppointments: 0,
      confirmedAppointments: 0
    };
    
    console.log('📊 Final stats being sent:', stats);
    
    // Transform the appointments data
    const transformedAppointments = todayAppointments.map(appointment => ({
      _id: appointment._id,
      appointmentDate: appointment.appointmentDate,
      appointmentTime: appointment.appointmentTime,
      status: appointment.status,
      amount: appointment.amount,
      createdAt: appointment.createdAt,
      userId: {
        name: appointment.userDetails.name,
        email: appointment.userDetails.email
      },
      serviceId: {
        name: appointment.serviceDetails.name,
        description: appointment.serviceDetails.description
      }
    }));
    
    console.log('📤 Sending today\'s appointments response');
    
    sendResponse(res, 200, true, "Today's appointments fetched successfully", {
      stats,
      appointments: transformedAppointments
    });
  } catch (error) {
    console.error("❌ Error fetching today's appointments:", error);
    sendResponse(res, 500, false, "Failed to fetch today's appointments");
  }
};

// Get monthly appointments using aggregation
exports.getMonthlyAppointments = async (req, res) => {
  try {
    console.log('🔍 Getting monthly appointments for provider:', req.user.id);
    
    const providerId = req.user.id;
    
    // Calculate start of current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    console.log('📅 Start of month:', startOfMonth);
    
    // Use aggregation to get monthly appointments with stats
    const monthlyStats = await Appointment.aggregate([
      {
        $match: {
          providerId: new mongoose.Types.ObjectId(providerId),
          createdAt: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          totalAppointments: { $sum: 1 },
          completedAppointments: {
            $sum: {
              $cond: [
                { $in: ['$status', ['completed', 'done']] },
                1,
                0
              ]
            }
          },
          totalAmount: { $sum: '$amount' },
          averageAmount: { $avg: '$amount' }
        }
      }
    ]);
    
    // Get appointments grouped by week
    const monthlyAppointments = await Appointment.aggregate([
      {
        $match: {
          providerId: new mongoose.Types.ObjectId(providerId),
          createdAt: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: {
            week: { $week: "$createdAt" },
            year: { $year: "$createdAt" }
          },
          appointments: { $push: "$$ROOT" },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.week": 1 }
      }
    ]);
    
    const stats = monthlyStats[0] || {
      totalAppointments: 0,
      completedAppointments: 0,
      totalAmount: 0,
      averageAmount: 0
    };
    
    console.log('📤 Sending monthly appointments response');
    
    sendResponse(res, 200, true, "Monthly appointments fetched successfully", {
      stats,
      monthlyAppointments
    });
  } catch (error) {
    console.error("❌ Error fetching monthly appointments:", error);
    sendResponse(res, 500, false, "Failed to fetch monthly appointments");
  }
};

exports.getProvidersByCity = async (req, res) => {
  const { city } = req.query;

  try {
    const providers = await Provider.find({
      availableCities: city,
      status: 'available',
    });

    res.status(200).json({ providers });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching providers by city' });
  }
};


exports.getNearbyProviders = async (req, res) => {
  const { lat, lng } = req.query;

  try {
    const providers = await Provider.find({
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: 10000 // meters = 10km
        }
      },
      status: 'available',
    });

    res.status(200).json({ providers });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching nearby providers' });
  }
};

// Get all provider appointments with filtering and pagination
exports.getAllProviderAppointments = async (req, res) => {
  console.log('🚀 getAllProviderAppointments function called!');
  try {
    console.log('🔍 Getting all appointments for provider:', req.user.id);
    console.log('👤 Provider object:', req.user);
    
    const { 
      fromDate, 
      toDate, 
      status, 
      page = 1, 
      limit = 50,
      sortBy = 'appointmentDate',
      sortOrder = 'desc'
    } = req.query;

    console.log('🔍 Query parameters:', { fromDate, toDate, status, page, limit, sortBy, sortOrder });

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

    // Calculate statistics for all appointments
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

    // console.log('📋 Found appointments:', appointments.length);
    // console.log('📊 Statistics:', stats);
    // console.log('📄 Appointments data:', appointments);

    sendResponse(res, 200, true, "All provider appointments fetched successfully", {
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
    console.error("❌ Error fetching all provider appointments:", error);
    sendResponse(res, 500, false, "Failed to fetch all provider appointments");
  }
};

// Test function for debugging
exports.testAllAppointments = async (req, res) => {
  console.log('🧪 testAllAppointments function called!');
  res.json({
    success: true,
    message: "All appointments test route is working",
    user: req.user,
    timestamp: new Date().toISOString()
  });
};

// Simple function to get all appointments by provider ID
exports.getAllAppointmentsByProvider = async (req, res) => {
  try {
    console.log('🚀 getAllAppointmentsByProvider called');
    console.log('👤 Provider ID from token:', req.user.id);
    
    const providerId = req.user.id;
    
    // Simple aggregation to get all appointments for this provider
    const appointments = await Appointment.aggregate([
      // Match appointments for this provider
      {
        $match: {
          providerId: new mongoose.Types.ObjectId(providerId)
        }
      },
      
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
      
      // Sort by creation date (newest first)
      { $sort: { createdAt: -1 } }
    ]);
    
    console.log('📋 Found appointments:', appointments.length);
    console.log('📄 Sample appointment:', appointments[0]);
    
    // Calculate simple statistics
    const stats = {
      total: appointments.length,
      pending: appointments.filter(apt => apt.status === 'pending').length,
      confirmed: appointments.filter(apt => apt.status === 'confirmed').length,
      completed: appointments.filter(apt => apt.status === 'completed').length,
      cancelled: appointments.filter(apt => apt.status === 'cancelled').length
    };
    
    console.log('📊 Statistics:', stats);
    
    res.json({
      success: true,
      message: "All appointments fetched successfully",
      appointments: appointments,
      statistics: stats,
      providerId: providerId
    });
    
  } catch (error) {
    console.error('❌ Error in getAllAppointmentsByProvider:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch appointments",
      error: error.message
    });
  }
};
