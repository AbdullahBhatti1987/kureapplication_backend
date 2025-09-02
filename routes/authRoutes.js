// // backend/routes/authRoutes.js
// const express = require("express");
// const router = express.Router();
// const {
//   loginUser,
//   registerUser,
//   registerProvider,
//   forgotPassword,
//   resetPassword,
//   verifyOtp,
// } = require("../controllers/authController");

// router.post("/verifyotp", verifyOtp);
// router.post("/register-user", registerUser);
// router.post("/register-provider", registerProvider);
// router.post("/login", loginUser);
// router.post("/forgot-password", forgotPassword);
// router.post("/reset-password", resetPassword);
// router.post("/send-otp", sendOtp);
// router.post("/verify-otp", verifyUserOtp);


// module.exports = router;


const express = require("express");
const router = express.Router();
const {
  sendOtp,
  registerUser,
  verifyUserOtp,
  userLogin,
  providerLogin,
  forgotPassword,
  resetPassword,
  registerProvider,
  googleLogin,
} = require("../controllers/authController");

router.post("/send-otp", sendOtp);
router.post("/register-user", registerUser);
router.post("/register-provider", registerProvider);
router.post("/verify-otp", verifyUserOtp);
router.post("/user-login", userLogin);
router.post("/provider-login", providerLogin);
router.post("/google", googleLogin);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;
