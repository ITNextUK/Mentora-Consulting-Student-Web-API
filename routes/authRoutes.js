const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateStudent } = require('../middlewares/auth');
const {
  validateStudentRegistration,
  validateLogin,
  validatePasswordReset,
  validateNewPassword
} = require('../middlewares/validation');

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new student
 * @access  Public
 */
router.post('/register', validateStudentRegistration, authController.register);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login student
 * @access  Public
 */
router.post('/login', validateLogin, authController.login);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh JWT token
 * @access  Public
 */
router.post('/refresh', authController.refreshToken);

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post('/forgot-password', validatePasswordReset, authController.forgotPassword);

/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password', validateNewPassword, authController.resetPassword);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current authenticated student
 * @access  Private
 */
router.get('/me', authenticateStudent, authController.getCurrentStudent);

module.exports = router;
