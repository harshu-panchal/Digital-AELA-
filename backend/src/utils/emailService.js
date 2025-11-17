import nodemailer from "nodemailer";

/**
 * Create email transporter based on environment variables
 * Supports SMTP, Gmail, SendGrid, and other providers
 */
const createTransporter = () => {
  // Use SMTP configuration from environment variables
  const config = {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER || process.env.EMAIL_USER,
      pass: process.env.SMTP_PASS || process.env.EMAIL_PASS,
    },
  };

  // If using Gmail with App Password
  if (process.env.EMAIL_SERVICE === "gmail") {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // App Password for Gmail
      },
    });
  }

  // If using SendGrid
  if (process.env.EMAIL_SERVICE === "sendgrid") {
    return nodemailer.createTransport({
      host: "smtp.sendgrid.net",
      port: 587,
      secure: false,
      auth: {
        user: "apikey",
        pass: process.env.SENDGRID_API_KEY,
      },
    });
  }

  // Default: Use SMTP configuration
  return nodemailer.createTransport(config);
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (email, resetToken, userName) => {
  try {
    const transporter = createTransporter();
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER || "noreply@digitalaela.com",
      to: email,
      subject: "Password Reset Request - Digital AELA",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px;">
            <h1 style="color: #2c3e50; margin-bottom: 20px;">Password Reset Request</h1>
            
            <p>Hello ${userName || "User"},</p>
            
            <p>We received a request to reset your password for your Digital AELA account.</p>
            
            <p>Click the button below to reset your password:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background-color: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Reset Password
              </a>
            </div>
            
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #3498db;">${resetUrl}</p>
            
            <p style="margin-top: 30px; font-size: 14px; color: #666;">
              <strong>Important:</strong> This link will expire in 1 hour for security reasons.
            </p>
            
            <p style="margin-top: 20px; font-size: 14px; color: #666;">
              If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
            </p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #999; text-align: center;">
              © ${new Date().getFullYear()} Digital AELA. All rights reserved.
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
        Password Reset Request - Digital AELA
        
        Hello ${userName || "User"},
        
        We received a request to reset your password for your Digital AELA account.
        
        Click the following link to reset your password:
        ${resetUrl}
        
        This link will expire in 1 hour for security reasons.
        
        If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
        
        © ${new Date().getFullYear()} Digital AELA. All rights reserved.
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw new Error("Failed to send password reset email");
  }
};

/**
 * Send password reset success confirmation email
 */
export const sendPasswordResetSuccessEmail = async (email, userName) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER || "noreply@digitalaela.com",
      to: email,
      subject: "Password Successfully Reset - Digital AELA",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset Success</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px;">
            <h1 style="color: #27ae60; margin-bottom: 20px;">✓ Password Successfully Reset</h1>
            
            <p>Hello ${userName || "User"},</p>
            
            <p>Your password has been successfully reset.</p>
            
            <p>If you did not make this change, please contact our support team immediately.</p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #999; text-align: center;">
              © ${new Date().getFullYear()} Digital AELA. All rights reserved.
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
        Password Successfully Reset - Digital AELA
        
        Hello ${userName || "User"},
        
        Your password has been successfully reset.
        
        If you did not make this change, please contact our support team immediately.
        
        © ${new Date().getFullYear()} Digital AELA. All rights reserved.
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending password reset success email:", error);
    // Don't throw - this is just a confirmation email
    return { success: false, error: error.message };
  }
};

/**
 * Test email configuration
 */
export const testEmailConfiguration = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    return { success: true, message: "Email configuration is valid" };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

