const express = require("express");
const sendEmail = require("../config/nodemailer");
const router = express.Router();
// const sendEmail = require("./path/to/sendEmail"); // Adjust path accordingly

router.post("/test-email", async (req, res) => {
  try {
    await sendEmail("abdullah.bhatti345@gmail.com", "Test Email Subject", "This is the test email body.");
    res.status(200).json({ message: "✅ Test email sent successfully!" });
  } catch (err) {
    console.error("❌ Email Error:", err);
    res.status(500).json({ error: "❌ Failed to send email", details: err.message });
  }
});

module.exports = router;
