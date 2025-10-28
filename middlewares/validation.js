const { body, param, query, validationResult } = require('express-validator');
const { createErrorResponse } = require('../utils/responseHelper');

/**
 * Middleware to handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json(
      createErrorResponse(
        'Validation failed',
        errors.array().map(err => ({
          field: err.path,
          message: err.msg
        }))
      )
    );
  }
  
  next();
};

/**
 * Student Registration Validation
 */
const validateStudentRegistration = [
  body('firstName')
    .trim()
    .notEmpty().withMessage('First name is required')
    .isLength({ min: 2, max: 50 }).withMessage('First name must be between 2-50 characters'),
  
  body('lastName')
    .trim()
    .notEmpty().withMessage('Last name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2-50 characters'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain uppercase, lowercase, number and special character'),
  
  body('phone')
    .optional()
    .isMobilePhone().withMessage('Invalid phone number'),
  
  handleValidationErrors
];

/**
 * Student Login Validation
 */
const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required'),
  
  handleValidationErrors
];

/**
 * Student Profile Update Validation
 */
const validateProfileUpdate = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('First name must be between 2-50 characters'),
  
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2-50 characters'),
  
  body('phone')
    .optional()
    .isMobilePhone().withMessage('Invalid phone number'),
  
  body('dateOfBirth')
    .optional()
    .isISO8601().withMessage('Invalid date format'),
  
  body('gender')
    .optional()
    .isIn(['Male', 'Female', 'Other', 'Prefer not to say']).withMessage('Invalid gender value'),
  
  body('gpa')
    .optional()
    .isFloat({ min: 0, max: 4.0 }).withMessage('GPA must be between 0 and 4.0'),
  
  body('ieltsScore')
    .optional()
    .isFloat({ min: 0, max: 9.0 }).withMessage('IELTS score must be between 0 and 9.0'),
  
  body('englishLevel')
    .optional()
    .isIn(['Native', 'Fluent', 'Advanced', 'Intermediate', 'Basic']).withMessage('Invalid English level'),
  
  body('github')
    .optional()
    .isURL().withMessage('Invalid GitHub URL'),
  
  body('linkedin')
    .optional()
    .isURL().withMessage('Invalid LinkedIn URL'),
  
  body('portfolio')
    .optional()
    .isURL().withMessage('Invalid Portfolio URL'),
  
  body('workExperience')
    .optional()
    .isArray().withMessage('Work experience must be an array'),
  
  body('skills')
    .optional()
    .isArray().withMessage('Skills must be an array'),
  
  body('coursesOfInterest')
    .optional()
    .isArray().withMessage('Courses of interest must be an array'),
  
  body('locationInterests')
    .optional()
    .isArray().withMessage('Location interests must be an array'),
  
  handleValidationErrors
];

/**
 * Password Reset Validation
 */
const validatePasswordReset = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  
  handleValidationErrors
];

/**
 * New Password Validation
 */
const validateNewPassword = [
  body('token')
    .notEmpty().withMessage('Reset token is required'),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain uppercase, lowercase, number and special character'),
  
  handleValidationErrors
];

/**
 * Student ID Parameter Validation
 */
const validateStudentId = [
  param('studentId')
    .notEmpty().withMessage('Student ID is required')
    .isString().withMessage('Student ID must be a string'),
  
  handleValidationErrors
];

/**
 * Search Query Validation
 */
const validateSearchQuery = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 2 }).withMessage('Search query must be at least 2 characters'),
  
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateStudentRegistration,
  validateLogin,
  validateProfileUpdate,
  validatePasswordReset,
  validateNewPassword,
  validateStudentId,
  validateSearchQuery
};
