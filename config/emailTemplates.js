const getOtpTemplate = (otp) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>KURE - OTP Verification</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            padding: 20px 0;
            background-color: #f8f9fa;
        }
        .logo {
            max-width: 150px;
            height: auto;
        }
        .content {
            padding: 20px;
            background-color: #ffffff;
        }
        .otp-box {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            text-align: center;
            margin: 20px 0;
        }
        .otp-code {
            font-size: 24px;
            font-weight: bold;
            color: #007bff;
            letter-spacing: 5px;
        }
        .footer {
            text-align: center;
            padding: 20px;
            font-size: 12px;
            color: #666;
            background-color: #f8f9fa;
        }
        .contact-info {
            margin-top: 10px;
            font-size: 12px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://kure.com/assets/images/kure.png" alt="KURE Logo" class="logo">
        </div>
        <div class="content">
            <h2>Welcome to KURE!</h2>
            <p>Thank you for choosing KURE. To complete your verification, please use the following OTP code:</p>
            
            <div class="otp-box">
                <div class="otp-code">${otp}</div>
            </div>
            
            <p>This OTP is valid for 5 minutes. Please do not share this OTP with anyone.</p>
            
            <p>If you didn't request this OTP, please ignore this email.</p>
        </div>
        <div class="footer">
            <p>© 2024 KURE. All rights reserved.</p>
            <div class="contact-info">
                <p>KURE Technologies</p>
                <p>123 Innovation Drive</p>
                <p>Tech Park, Suite 500</p>
                <p>Bangalore, Karnataka 560103</p>
                <p>Phone: +91 80 1234 5678</p>
                <p>Email: support@kure.com</p>
                <p>Website: www.kure.com</p>
            </div>
        </div>
    </div>
</body>
</html>
`;

const getPasswordResetTemplate = (otp) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>KURE - Password Reset</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            padding: 20px 0;
            background-color: #f8f9fa;
        }
        .logo {
            max-width: 150px;
            height: auto;
        }
        .content {
            padding: 20px;
            background-color: #ffffff;
        }
        .otp-box {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            text-align: center;
            margin: 20px 0;
        }
        .otp-code {
            font-size: 24px;
            font-weight: bold;
            color: #007bff;
            letter-spacing: 5px;
        }
        .footer {
            text-align: center;
            padding: 20px;
            font-size: 12px;
            color: #666;
            background-color: #f8f9fa;
        }
        .contact-info {
            margin-top: 10px;
            font-size: 12px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://kure.com/assets/images/kure.png" alt="KURE Logo" class="logo">
        </div>
        <div class="content">
            <h2>Password Reset Request</h2>
            <p>We received a request to reset your password. Use the following OTP code to proceed with the password reset:</p>
            
            <div class="otp-box">
                <div class="otp-code">${otp}</div>
            </div>
            
            <p>This OTP is valid for 10 minutes. Please do not share this OTP with anyone.</p>
            
            <p>If you didn't request a password reset, please ignore this email or contact our support team.</p>
        </div>
        <div class="footer">
            <p>© 2024 KURE. All rights reserved.</p>
            <div class="contact-info">
                <p>KURE Technologies</p>
                <p>123 Innovation Drive</p>
                <p>Tech Park, Suite 500</p>
                <p>Bangalore, Karnataka 560103</p>
                <p>Phone: +91 80 1234 5678</p>
                <p>Email: support@kure.com</p>
                <p>Website: www.kure.com</p>
            </div>
        </div>
    </div>
</body>
</html>
`;

module.exports = {
    getOtpTemplate,
    getPasswordResetTemplate
}; 