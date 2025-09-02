const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/UserModel");
const Provider = require("../models/ProviderModel");
const Otp = require("../models/Otp");
const generateOtp = require("../utils/generateOtp");
const sendResponse = require("../helpers/sendResponse");
const sendEmail = require("../config/nodemailer");

// REGISTER USER
exports.sendOtp = async (req, res) => {
  try {
    const { email, mobile, role } = req.body;
    console.log("Received OTP request:", { email, mobile, role });

    // Check if email is already registered
    const existingEmail = await Provider.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "Email already registered as provider",
      });
    }

    // Check if mobile is already registered
    const existingMobile = await Provider.findOne({ mobile });
    if (existingMobile) {
      return res.status(400).json({
        success: false,
        message: "Mobile already registered as provider",
      });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    console.log("Generated OTP:", { otp, otpExpiry });

    // Save OTP to database
    const otpRecord = await Otp.findOneAndUpdate(
      { email },
      {
        otp,
        otpExpiry,
        purpose: "register",
      },
      { upsert: true, new: true }
    );

    console.log("Saved OTP to database:", otpRecord);

    // Check if email credentials are configured
    if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
      console.error("Email credentials not configured!");
      console.error("Please set GMAIL_USER and GMAIL_PASS in your .env file");

      // For development/testing, return OTP in response
      if (process.env.NODE_ENV === 'development') {
        console.log("Development mode: Returning OTP in response");
        return res.status(200).json({
          success: true,
          message: "OTP generated successfully (Email not configured)",
          otp: otp, // Only in development
          email: email
        });
      }

      return res.status(500).json({
        success: false,
        message: "Email service not configured. Please contact administrator.",
      });
    }

    // Send OTP via email
    try {
      const emailSent = await sendEmail(email, "KURE - OTP Verification", "otp", {
        otp,
      });

      if (!emailSent) {
        console.error("Failed to send OTP email");
        return res.status(500).json({
          success: false,
          message: "Failed to send OTP email",
        });
      }

      console.log("OTP email sent successfully");

      res.status(200).json({
        success: true,
        message: "OTP sent successfully",
      });
    } catch (emailError) {
      console.error("Email sending error:", emailError);

      // For development/testing, return OTP in response if email fails
      if (process.env.NODE_ENV === 'development') {
        console.log("Development mode: Email failed, returning OTP in response");
        return res.status(200).json({
          success: true,
          message: "OTP generated successfully (Email sending failed)",
          otp: otp, // Only in development
          email: email,
          emailError: emailError.message
        });
      }

      return res.status(500).json({
        success: false,
        message: "Failed to send OTP email. Please try again.",
      });
    }
  } catch (error) {
    console.error("Error in sendOtp:", error);
    res.status(500).json({
      success: false,
      message: "Error sending OTP",
    });
  }
};

exports.registerUser = async (req, res) => {
  try {
    const { email, password, otp, ...rest } = req.body;

    const otpRecord = await Otp.findOne({ email, otp, purpose: "register" });

    if (!otpRecord || otpRecord.expiresAt < new Date()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      email,
      password: hashedPassword,
      isVerified: true,
      ...rest,
    });

    await newUser.save();

    await Otp.deleteMany({ email, purpose: "register" });

    const token = jwt.sign(
      { id: newUser._id, role: newUser.role || "user" },
      process.env.JWT_SECRET || "your_jwt_secret",
      { expiresIn: "1d" }
    );

    res.status(201).json({
      message: "User registered successfully",
      user: newUser,
      token,
      role: newUser.role || "user",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error during registration" });
  }
};

exports.verifyUserOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const otpRecord = await Otp.findOne({ email, otp, purpose: "register" });

    if (!otpRecord || otpRecord.expiresAt < new Date()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // ✅ Mark user as verified
    await User.updateOne({ email }, { isVerified: true });

    // ✅ Delete OTP after successful verification
    await Otp.deleteMany({ email, purpose: "register" });

    res
      .status(200)
      .json({ success: true, message: "Email verified successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error during OTP verification" });
  }
};

// USER LOGIN (only checks User collection)
exports.userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("User login attempt for:", email);

    // Only check User collection
    const user = await User.findOne({ email });

    if (!user) {
      console.log("User not found in User collection");
      return res.status(404).json({
        success: false,
        message: "User not found. Please check your email or register as a user."
      });
    }

    if (!user.isVerified) {
      console.log("User not verified");
      return res.status(401).json({
        success: false,
        message: "Please verify your email first"
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("Invalid password");
      return res.status(401).json({
        success: false,
        message: "Invalid password"
      });
    }

    const userToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || "your_jwt_secret",
      { expiresIn: "1d" }
    );

    console.log("User login successful, role:", user.role);

    // Return complete user data
    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        isVerified: user.isVerified,
        address: user.address,
        role: user.role,
        createdAt: user.createdAt
      },
      token: userToken,
      role: user.role
    });

  } catch (err) {
    console.error("User login error:", err);
    res.status(500).json({
      success: false,
      message: "Server error during user login"
    });
  }
};

// PROVIDER LOGIN (only checks Provider collection)
exports.providerLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Provider login attempt for:", email);

    // Only check Provider collection
    const provider = await Provider.findOne({ email });

    if (!provider) {
      console.log("Provider not found in Provider collection");
      return res.status(404).json({
        success: false,
        message: "Provider not found. Please check your email or register as a provider."
      });
    }

    if (!provider.isVerified) {
      console.log("Provider not verified");
      return res.status(401).json({
        success: false,
        message: "Please verify your email first"
      });
    }

    const isMatch = await bcrypt.compare(password, provider.password);
    if (!isMatch) {
      console.log("Invalid password");
      return res.status(401).json({
        success: false,
        message: "Invalid password"
      });
    }

    const providerToken = jwt.sign(
      { id: provider._id, role: "provider" },
      process.env.JWT_SECRET || "your_jwt_secret",
      { expiresIn: "1d" }
    );

    console.log("Provider login successful");

    res.json({
      success: true,
      user: {
        id: provider._id,
        email: provider.email,
        name: provider.name,
        role: "provider"
      },
      token: providerToken,
      role: "provider"
    });

  } catch (err) {
    console.error("Provider login error:", err);
    res.status(500).json({
      success: false,
      message: "Server error during provider login"
    });
  }
};

// REGISTER PROVIDER
exports.registerProvider = async (req, res) => {
  try {
    const { email, password, otp, ...rest } = req.body;
    console.log("Provider registration attempt:", { email, otp });
    console.log("Provider registration data:", rest);

    // Verify OTP
    const otpRecord = await Otp.findOne({
      email,
      otp,
      purpose: "register",
    });

    console.log("Found OTP record:", otpRecord);

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    if (otpRecord.otpExpiry < new Date()) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired",
      });
    }

    // Check if email is already registered
    const existingEmail = await Provider.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "Email already registered as provider",
      });
    }

    // Check if mobile is already registered
    const existingMobile = await Provider.findOne({ mobile: rest.mobile });
    if (existingMobile) {
      return res.status(400).json({
        success: false,
        message: "Mobile already registered as provider",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Clean and validate data
    const providerData = {
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      isVerified: true,
      role: "provider",
      name: rest.name?.trim(),
      mobile: rest.mobile?.trim(),
      businessName: rest.businessName?.trim(),
      businessType: rest.businessType?.trim(),
      serviceCategory: rest.serviceCategory?.trim(),
      specialization: rest.specialization?.trim(),
      licenseNumber: rest.licenseNumber?.trim(),
      yearsOfExperience: rest.yearsOfExperience?.toString(),
      address: {
        street: rest.address?.street?.trim(),
        street2: rest.address?.street2?.trim() || "",
        state: rest.address?.state?.trim(),
        zip: rest.address?.zip?.trim(),
      },
      certifications: rest.certifications || [],
      education: rest.education || [],
      services: rest.services || [],
      insuranceAccepted: rest.insuranceAccepted || "",
      languages: rest.languages || "",
    };

    console.log("Cleaned provider data:", providerData);

    // Validate required fields
    const requiredFields = ['name', 'mobile', 'businessName', 'businessType', 'serviceCategory', 'specialization', 'licenseNumber', 'yearsOfExperience'];
    const missingFields = requiredFields.filter(field => !providerData[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`,
      });
    }

    // Validate address fields
    if (!providerData.address.street || !providerData.address.state || !providerData.address.zip) {
      return res.status(400).json({
        success: false,
        message: "Address fields (street, state, zip) are required",
      });
    }

    // Create new provider
    const newProvider = new Provider(providerData);

    console.log("Attempting to save provider:", newProvider);

    await newProvider.save();
    console.log("Provider saved successfully");

    // Delete used OTP
    await Otp.deleteMany({ email, purpose: "register" });
    console.log("OTP record deleted");

    // Generate JWT token
    const token = jwt.sign(
      { id: newProvider._id, role: "provider" },
      process.env.JWT_SECRET || "your_jwt_secret",
      { expiresIn: "1d" }
    );

    res.status(201).json({
      success: true,
      message: "Provider registered successfully",
      user: newProvider,
      token,
      role: "provider",
    });
  } catch (err) {
    console.error("Registration error details:", {
      message: err.message,
      stack: err.stack
    });

    res.status(500).json({
      success: false,
      message: "Server error during provider registration",
    });
  }
};

// FORGOT PASSWORD
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    console.log("Recevied email", email)
    const user = await User.findOne({ email });
    const provider = await Provider.findOne({ email });
    const foundUser = user || provider;

    if (!foundUser)
      return res.status(404).json({ message: "No account with that email" });

    const otp = generateOtp();

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    await Otp.create({
      email,
      otp,
      purpose: "forgot-password",
      expiresAt,
    });

    await sendEmail(
      email,
      "Password Reset OTP",
      "password-reset",
      { otp }
    );

    res.status(200).json({ message: "OTP sent to email" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// RESET PASSWORD
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const otpRecord = await Otp.findOne({ email, otp, purpose: "forgot-password" });
    if (!otpRecord || otpRecord.expiresAt < new Date()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const user = await User.findOne({ email });
    const provider = await Provider.findOne({ email });
    const foundUser = user || provider;

    if (!foundUser)
      return res.status(404).json({ message: "Account not found" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    foundUser.password = hashedPassword;
    await foundUser.save();

    await Otp.deleteMany({ email, purpose: "forgot-password" });


    res.status(200).json({ message: "Password reset successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// GOOGLE LOGIN
exports.googleLogin = async (req, res) => {
  try {
    const { token, role } = req.body;
    console.log("Google login attempt with token for role:", role);

    // Here you would verify the Google token and get user info
    // For now, we'll use a placeholder - you'll need to implement Google token verification
    const googleUserInfo = {
      email: "example@google.com", // This should come from Google token verification
      name: "Google User",
      // Add other fields as needed
    };

    if (role === "user") {
      // Check User collection for user login
      let user = await User.findOne({ email: googleUserInfo.email });

      if (user) {
        console.log("Google user found in User collection");

        const userToken = jwt.sign(
          { id: user._id, role: "user" },
          process.env.JWT_SECRET || "your_jwt_secret",
          { expiresIn: "1d" }
        );

        res.json({
          success: true,
          data: {
            id: user._id,
            email: user.email,
            name: user.name,
            role: "user"
          },
          token: userToken,
          role: "user"
        });
        return;
      }
    } else if (role === "provider") {
      // Check Provider collection for provider login
      let provider = await Provider.findOne({ email: googleUserInfo.email });

      if (provider) {
        console.log("Google user found in Provider collection");

        const providerToken = jwt.sign(
          { id: provider._id, role: "provider" },
          process.env.JWT_SECRET || "your_jwt_secret",
          { expiresIn: "1d" }
        );

        res.json({
          success: true,
          data: {
            id: provider._id,
            email: provider.email,
            name: provider.name,
            role: "provider"
          },
          token: providerToken,
          role: "provider"
        });
        return;
      }
    }

    // If not found in the specified collection
    console.log("Google user not found in specified collection");
    return res.status(404).json({
      success: false,
      message: `No ${role} account found with this email. Please register first.`
    });

  } catch (err) {
    console.error("Google login error:", err);
    res.status(500).json({
      success: false,
      message: "Server error during Google login"
    });
  }
};
