const nodemailer = require("nodemailer");
const { getOtpTemplate, getPasswordResetTemplate } = require("./emailTemplates");
require('dotenv').config();

// Log environment variables (remove in production)
console.log("Email Config:", {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS ? "Password is set" : "Password is missing"
});

if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
    console.error("Email credentials not configured in .env file");
    console.error("Please set GMAIL_USER and GMAIL_PASS in your .env file");
}

// Create reusable transporter object using Gmail SMTP
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
    }
});

// Verify transporter configuration
transporter.verify(function (error, success) {
    if (error) {
        console.error("Transporter verification error:", error);
    } else {
        console.log("Gmail SMTP server is ready to take our messages");
    }
});

const sendEmail = async (recipient, subject, type, data) => {
    try {
        if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
            throw new Error("Email credentials not configured. Please check your .env file.");
        }

        console.log("Sending email to:", recipient);
        console.log("Email type:", type);
        console.log("Email data:", data);

        let htmlContent;
        switch (type) {
            case 'otp':
                htmlContent = getOtpTemplate(data.otp);
                break;
            case 'password-reset':
                htmlContent = getPasswordResetTemplate(data.otp);
                break;
            default:
                throw new Error("Invalid email type");
        }

        const mailOptions = {
            from: process.env.GMAIL_USER,
            to: recipient,
            subject: subject,
            html: htmlContent
        };

        console.log("Mail options:", { ...mailOptions, auth: "***" });

        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent successfully:", info.messageId);
        return true;
    } catch (error) {
        console.error("Error sending email:", error);
        throw error;
    }
};

module.exports = sendEmail;
