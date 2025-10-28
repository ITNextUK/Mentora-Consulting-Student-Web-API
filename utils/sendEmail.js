const nodemailer = require('nodemailer');
const logger = require('./logger');

/**
 * Create email transporter
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  });
};

/**
 * Send email
 */
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
      text
    };
    
    const info = await transporter.sendMail(mailOptions);
    
    logger.info(`Email sent: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error('Email sending failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send welcome email
 */
const sendWelcomeEmail = async (student) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #012169;">Welcome to Mentora Consulting, ${student.firstName}!</h2>
      <p>Thank you for registering with Mentora Consulting Student Portal.</p>
      <p>We're excited to help you on your journey to studying at top UK universities.</p>
      <p>Next steps:</p>
      <ul>
        <li>Complete your student profile</li>
        <li>Upload your CV for AI-powered extraction</li>
        <li>Browse available universities and courses</li>
        <li>Submit your applications</li>
      </ul>
      <p>If you have any questions, please don't hesitate to contact us.</p>
      <p>Best regards,<br>The Mentora Consulting Team</p>
    </div>
  `;
  
  return await sendEmail({
    to: student.email,
    subject: 'Welcome to Mentora Consulting!',
    html,
    text: `Welcome to Mentora Consulting, ${student.firstName}! Thank you for registering.`
  });
};

/**
 * Send password reset email
 */
const sendPasswordResetEmail = async (student, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #012169;">Password Reset Request</h2>
      <p>Hi ${student.firstName},</p>
      <p>We received a request to reset your password for your Mentora Consulting account.</p>
      <p>Click the button below to reset your password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" 
           style="background-color: #012169; color: white; padding: 12px 30px; 
                  text-decoration: none; border-radius: 5px; display: inline-block;">
          Reset Password
        </a>
      </div>
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all;">${resetUrl}</p>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request a password reset, please ignore this email.</p>
      <p>Best regards,<br>The Mentora Consulting Team</p>
    </div>
  `;
  
  return await sendEmail({
    to: student.email,
    subject: 'Password Reset Request - Mentora Consulting',
    html,
    text: `Password reset link: ${resetUrl}`
  });
};

/**
 * Send profile completion reminder
 */
const sendProfileCompletionReminder = async (student) => {
  const profileUrl = `${process.env.FRONTEND_URL}/profile`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #012169;">Complete Your Profile</h2>
      <p>Hi ${student.firstName},</p>
      <p>We noticed you haven't completed your student profile yet.</p>
      <p>Completing your profile helps us:</p>
      <ul>
        <li>Match you with suitable universities</li>
        <li>Provide personalized course recommendations</li>
        <li>Speed up your application process</li>
      </ul>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${profileUrl}" 
           style="background-color: #012169; color: white; padding: 12px 30px; 
                  text-decoration: none; border-radius: 5px; display: inline-block;">
          Complete Profile
        </a>
      </div>
      <p>Best regards,<br>The Mentora Consulting Team</p>
    </div>
  `;
  
  return await sendEmail({
    to: student.email,
    subject: 'Complete Your Mentora Consulting Profile',
    html,
    text: `Complete your profile at: ${profileUrl}`
  });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendProfileCompletionReminder
};
