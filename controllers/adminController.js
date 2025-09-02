const User = require('../models/UserModel');
const Provider = require('../models/ProviderModel');
const Service = require('../models/serviceModel');
const Appointment = require('../models/AppointmentModel');
const { sendResponse } = require('../helpers/sendResponse');

// Dashboard Stats
const getDashboardStats = async (req, res) => {
  try {
    // Get basic counts
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalProviders = await Provider.countDocuments();
    const totalServices = await Service.countDocuments();
    const totalAppointments = await Appointment.countDocuments();

    // Get pending approvals
    const pendingProviders = await Provider.countDocuments({ isApproved: false });
    const todayAppointments = await Appointment.countDocuments({
      createdAt: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        $lt: new Date(new Date().setHours(23, 59, 59, 999))
      }
    });

    // Calculate monthly revenue (simplified - you might want to add actual payment tracking)
    const monthlyRevenue = totalAppointments * 50; // Assuming $50 per appointment

    // Get recent activities
    const recentActivities = await Appointment.find()
      .populate('user', 'name')
      .populate('provider', 'name')
      .populate('service', 'name')
      .sort({ createdAt: -1 })
      .limit(10)
      .then(appointments => 
        appointments.map(apt => ({
          type: 'appointment',
          title: `Appointment booked: ${apt.service?.name || 'Service'} by ${apt.user?.name || 'User'}`,
          time: apt.createdAt
        }))
      );

    res.json({
      success: true,
      data: {
        totalUsers,
        totalProviders,
        totalServices,
        totalAppointments,
        pendingProviders,
        todayAppointments,
        monthlyRevenue,
        recentActivities
      }
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = 'all' } = req.query;
    
    let query = { role: 'user' };
    
    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Status filter
    if (status === 'verified') {
      query.isVerified = true;
    } else if (status === 'pending') {
      query.isVerified = false;
    }
    
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await User.countDocuments(query);
    
    res.json({
      success: true,
      data: users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Verify user
const verifyUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isVerified: true },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({ success: true, data: user, message: 'User verified successfully' });
  } catch (error) {
    console.error('Error verifying user:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Block user
const blockUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBlocked: true },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({ success: true, data: user, message: 'User blocked successfully' });
  } catch (error) {
    console.error('Error blocking user:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get all providers
const getAllProviders = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = 'all' } = req.query;
    
    let query = {};
    
    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
        { specialization: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Status filter
    if (status === 'approved') {
      query.isApproved = true;
    } else if (status === 'pending') {
      query.isApproved = false;
    } else if (status === 'verified') {
      query.isVerified = true;
    }
    
    const providers = await Provider.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Provider.countDocuments(query);
    
    res.json({
      success: true,
      data: providers,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error getting providers:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get provider by ID
const getProviderById = async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.id).select('-password');
    if (!provider) {
      return res.status(404).json({ success: false, message: 'Provider not found' });
    }
    res.json({ success: true, data: provider });
  } catch (error) {
    console.error('Error getting provider:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Approve provider
const approveProvider = async (req, res) => {
  try {
    const provider = await Provider.findByIdAndUpdate(
      req.params.id,
      { isApproved: true },
      { new: true }
    ).select('-password');
    
    if (!provider) {
      return res.status(404).json({ success: false, message: 'Provider not found' });
    }
    
    res.json({ success: true, data: provider, message: 'Provider approved successfully' });
  } catch (error) {
    console.error('Error approving provider:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Reject provider
const rejectProvider = async (req, res) => {
  try {
    const provider = await Provider.findByIdAndUpdate(
      req.params.id,
      { isApproved: false },
      { new: true }
    ).select('-password');
    
    if (!provider) {
      return res.status(404).json({ success: false, message: 'Provider not found' });
    }
    
    res.json({ success: true, data: provider, message: 'Provider rejected successfully' });
  } catch (error) {
    console.error('Error rejecting provider:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Verify provider
const verifyProvider = async (req, res) => {
  try {
    const provider = await Provider.findByIdAndUpdate(
      req.params.id,
      { isVerified: true },
      { new: true }
    ).select('-password');
    
    if (!provider) {
      return res.status(404).json({ success: false, message: 'Provider not found' });
    }
    
    res.json({ success: true, data: provider, message: 'Provider verified successfully' });
  } catch (error) {
    console.error('Error verifying provider:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Block provider
const blockProvider = async (req, res) => {
  try {
    const provider = await Provider.findByIdAndUpdate(
      req.params.id,
      { isBlocked: true },
      { new: true }
    ).select('-password');
    
    if (!provider) {
      return res.status(404).json({ success: false, message: 'Provider not found' });
    }
    
    res.json({ success: true, data: provider, message: 'Provider blocked successfully' });
  } catch (error) {
    console.error('Error blocking provider:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Delete provider
const deleteProvider = async (req, res) => {
  try {
    const provider = await Provider.findByIdAndDelete(req.params.id);
    if (!provider) {
      return res.status(404).json({ success: false, message: 'Provider not found' });
    }
    
    res.json({ success: true, message: 'Provider deleted successfully' });
  } catch (error) {
    console.error('Error deleting provider:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get all services
const getAllServices = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', category = 'all' } = req.query;
    
    let query = {};
    
    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Category filter
    if (category !== 'all') {
      query.category = category;
    }
    
    const services = await Service.find(query)
      .populate('provider', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Service.countDocuments(query);
    
    res.json({
      success: true,
      data: services,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error getting services:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get service by ID
const getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id).populate('provider', 'name');
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    res.json({ success: true, data: service });
  } catch (error) {
    console.error('Error getting service:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Approve service
const approveService = async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      { isApproved: true },
      { new: true }
    ).populate('provider', 'name');
    
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    
    res.json({ success: true, data: service, message: 'Service approved successfully' });
  } catch (error) {
    console.error('Error approving service:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Reject service
const rejectService = async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      { isApproved: false },
      { new: true }
    ).populate('provider', 'name');
    
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    
    res.json({ success: true, data: service, message: 'Service rejected successfully' });
  } catch (error) {
    console.error('Error rejecting service:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Feature service
const featureService = async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      { isFeatured: true },
      { new: true }
    ).populate('provider', 'name');
    
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    
    res.json({ success: true, data: service, message: 'Service featured successfully' });
  } catch (error) {
    console.error('Error featuring service:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Delete service
const deleteService = async (req, res) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    
    res.json({ success: true, message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get reports
const getReports = async (req, res) => {
  try {
    // Overview stats
    const overview = {
      totalUsers: await User.countDocuments({ role: 'user' }),
      totalProviders: await Provider.countDocuments(),
      totalServices: await Service.countDocuments(),
      totalRevenue: await Appointment.countDocuments() * 50, // Simplified
      activeAppointments: await Appointment.countDocuments({ status: 'confirmed' }),
      pendingApprovals: await Provider.countDocuments({ isApproved: false })
    };

    // User stats (last 7 days)
    const userStats = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const count = await User.countDocuments({
        role: 'user',
        createdAt: {
          $gte: new Date(date.setHours(0, 0, 0, 0)),
          $lt: new Date(date.setHours(23, 59, 59, 999))
        }
      });
      userStats.push({ count });
    }

    // Revenue stats (last 7 days)
    const revenueStats = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const count = await Appointment.countDocuments({
        createdAt: {
          $gte: new Date(date.setHours(0, 0, 0, 0)),
          $lt: new Date(date.setHours(23, 59, 59, 999))
        }
      });
      revenueStats.push({ revenue: count * 50 }); // $50 per appointment
    }

    // Provider performance
    const providerStats = await Provider.find()
      .select('name specialization rating')
      .limit(5)
      .then(providers => 
        providers.map(provider => ({
          name: provider.name,
          specialization: provider.specialization,
          rating: provider.rating || 4.5,
          appointments: Math.floor(Math.random() * 50) + 10 // Mock data
        }))
      );

    // Service stats
    const serviceStats = await Service.find()
      .populate('provider', 'name')
      .limit(5)
      .then(services => 
        services.map(service => ({
          name: service.name,
          category: service.category,
          price: service.price,
          bookings: Math.floor(Math.random() * 30) + 5 // Mock data
        }))
      );

    // Recent activity
    const recentActivity = await Appointment.find()
      .populate('user', 'name')
      .populate('provider', 'name')
      .populate('service', 'name')
      .sort({ createdAt: -1 })
      .limit(10)
      .then(appointments => 
        appointments.map(apt => ({
          type: 'appointment',
          title: `Appointment: ${apt.service?.name || 'Service'} by ${apt.user?.name || 'User'}`,
          time: apt.createdAt
        }))
      );

    res.json({
      success: true,
      data: {
        overview,
        userStats,
        revenueStats,
        providerStats,
        serviceStats,
        recentActivity
      }
    });
  } catch (error) {
    console.error('Error getting reports:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  getUserById,
  verifyUser,
  blockUser,
  deleteUser,
  getAllProviders,
  getProviderById,
  approveProvider,
  rejectProvider,
  verifyProvider,
  blockProvider,
  deleteProvider,
  getAllServices,
  getServiceById,
  approveService,
  rejectService,
  featureService,
  deleteService,
  getReports
}; 