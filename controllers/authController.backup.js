const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Student = require('../models/StudentMongo');
const { createSuccessResponse, createErrorResponse } = require('../utils/responseHelper');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('../utils/sendEmail');
const logger = require('../utils/logger');

/**
 * Generate JWT token
 */
const generateToken = (studentId) => {
  return jwt.sign(
    { studentId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

/**
 * Generate refresh token
 */
const generateRefreshToken = (studentId) => {
  return jwt.sign(
    { studentId, type: 'refresh' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' }
  );
};

/**
 * Register new student
 */
const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone } = req.body;

    // Check if student already exists
    const existingStudent = await Student.findOne({ email: email.toLowerCase() });
    if (existingStudent) {
      return res.status(409).json(
        createErrorResponse('Student with this email already exists')
      );
    }

    // Create new student (password will be hashed by pre-save hook)
    const student = new Student({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password,
      phone: phone || undefined
    });

    await student.save();

    // Generate tokens
    const token = generateToken(student._id);
    const refreshToken = generateRefreshToken(student._id);

    // Send welcome email (async, don't wait)
    sendWelcomeEmail(email, firstName).catch(err => 
      logger.error('Failed to send welcome email:', err)
    );

    logger.info(`Student registered: ${student._id}`);

    res.status(201).json(
      createSuccessResponse('Registration successful', {
        student: student.toPublicJSON(),
        token,
        refreshToken
      })
    );
  } catch (error) {
    logger.error('Registration error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(409).json(
        createErrorResponse('Student with this email already exists')
      );
    }
    
    res.status(500).json(
      createErrorResponse('Registration failed', error.message)
    );
  }
};

/**
 * Login student
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find student by email
    const student = await Student.findOne({ email: email.toLowerCase() });
    
    if (!student) {
      return res.status(401).json(
        createErrorResponse('Invalid email or password')
      );
    }

    // Check if student is active
    if (student.status !== 'active') {
      return res.status(401).json(
        createErrorResponse('Account is not active. Please contact support.')
      );
    }

    // Verify password using model method
    const isPasswordValid = await student.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json(
        createErrorResponse('Invalid email or password')
      );
    }

    // Update last login
    student.lastLogin = new Date();
    await student.save();

    // Generate tokens
    const token = generateToken(student._id);
    const refreshToken = generateRefreshToken(student._id);

    logger.info(`Student logged in: ${student._id}`);

    res.json(
      createSuccessResponse('Login successful', {
        student: student.toPublicJSON(),
        token,
        refreshToken
      })
    );
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json(
      createErrorResponse('Login failed', error.message)
    );
  }
};

/**
 * Refresh JWT token
 */
const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(400).json(
        createErrorResponse('Refresh token is required')
      );
    }

    // Verify refresh token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.type !== 'refresh') {
      return res.status(401).json(
        createErrorResponse('Invalid refresh token')
      );
    }

    // Check if student exists and is active
    const student = await Student.findByPk(decoded.studentId);
    
    if (!student || student.status !== 'Active') {
      return res.status(401).json(
        createErrorResponse('Student not found or inactive')
      );
    }

    // Generate new tokens
    const newToken = generateToken(decoded.studentId);
    const newRefreshToken = generateRefreshToken(decoded.studentId);

    res.json(
      createSuccessResponse('Token refreshed successfully', {
        token: newToken,
        refreshToken: newRefreshToken
      })
    );
  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(401).json(
      createErrorResponse('Invalid or expired refresh token')
    );
  }
};

/**
 * Request password reset
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const student = await Student.findOne({ where: { email } });
    
    if (!student) {
      // Don't reveal if email exists
      return res.json(
        createSuccessResponse('If the email exists, a reset link will be sent')
      );
    }

    // Generate reset token (valid for 1 hour)
    const resetToken = jwt.sign(
      { studentId: student.studentId, type: 'reset' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Send reset email
    await sendPasswordResetEmail(student, resetToken);

    logger.info(`Password reset requested for: ${student.studentId}`);

    res.json(
      createSuccessResponse('If the email exists, a reset link will be sent')
    );
  } catch (error) {
    logger.error('Forgot password error:', error);
    res.status(500).json(
      createErrorResponse('Failed to process password reset request')
    );
  }
};

/**
 * Reset password with token
 */
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    // Verify reset token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.type !== 'reset') {
      return res.status(401).json(
        createErrorResponse('Invalid reset token')
      );
    }

    // Find student
    const student = await Student.findByPk(decoded.studentId);
    
    if (!student) {
      return res.status(404).json(
        createErrorResponse('Student not found')
      );
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 10);

    // Update password using stored procedure
    await Student.sequelize.query(
      `SELECT mentora_ref.sp_ref_student_modify(
        :studentId, :firstName, :lastName, :email, :phone,
        :nic, :dateOfBirth, :gender, :address, :city, :country, :profilePicturePath,
        :degree, :institution, :graduationYear, :gpa, :ieltsScore, :englishLevel,
        :workExperience, :skills, :coursesOfInterest, :locationInterests,
        :github, :linkedin, :portfolio, :cvPath,
        :passwordHash, :status, :studentId
      )`,
      {
        replacements: {
          studentId: student.studentId,
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email,
          phone: student.phone,
          nic: student.nic,
          dateOfBirth: student.dateOfBirth,
          gender: student.gender,
          address: student.address,
          city: student.city,
          country: student.country,
          profilePicturePath: student.profilePicturePath,
          degree: student.degree,
          institution: student.institution,
          graduationYear: student.graduationYear,
          gpa: student.gpa,
          ieltsScore: student.ieltsScore,
          englishLevel: student.englishLevel,
          workExperience: JSON.stringify(student.workExperience || []),
          skills: JSON.stringify(student.skills || []),
          coursesOfInterest: JSON.stringify(student.coursesOfInterest || []),
          locationInterests: JSON.stringify(student.locationInterests || []),
          github: student.github,
          linkedin: student.linkedin,
          portfolio: student.portfolio,
          cvPath: student.cvPath,
          passwordHash,
          status: student.status
        },
        type: Student.sequelize.QueryTypes.SELECT
      }
    );

    logger.info(`Password reset successful for: ${student.studentId}`);

    res.json(
      createSuccessResponse('Password reset successful')
    );
  } catch (error) {
    logger.error('Reset password error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json(
        createErrorResponse('Reset token has expired')
      );
    }
    
    res.status(500).json(
      createErrorResponse('Failed to reset password')
    );
  }
};

/**
 * Get current authenticated student
 */
const getCurrentStudent = async (req, res) => {
  try {
    res.json(
      createSuccessResponse('Student retrieved successfully', req.student.toJSON())
    );
  } catch (error) {
    logger.error('Get current student error:', error);
    res.status(500).json(
      createErrorResponse('Failed to retrieve student data')
    );
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  forgotPassword,
  resetPassword,
  getCurrentStudent
};
