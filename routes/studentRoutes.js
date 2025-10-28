const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { authenticateStudent } = require('../middlewares/auth');
const { uploadCV, uploadProfilePicture } = require('../middlewares/fileUpload');
const { validateProfileUpdate } = require('../middlewares/validation');

/**
 * @route   GET /api/v1/students/profile
 * @desc    Get current student profile
 * @access  Private
 */
router.get('/profile', authenticateStudent, studentController.getProfile);

/**
 * @route   PUT /api/v1/students/profile
 * @desc    Update student profile
 * @access  Private
 */
router.put(
  '/profile',
  authenticateStudent,
  validateProfileUpdate,
  studentController.updateProfile
);

/**
 * @route   POST /api/v1/students/cv/upload
 * @desc    Upload CV file
 * @access  Private
 */
router.post(
  '/cv/upload',
  authenticateStudent,
  uploadCV,
  studentController.uploadCV
);

/**
 * @route   POST /api/v1/students/cv/extract
 * @desc    Extract data from uploaded CV
 * @access  Private
 */
router.post(
  '/cv/extract',
  authenticateStudent,
  studentController.extractCVData
);

/**
 * @route   DELETE /api/v1/students/cv
 * @desc    Delete CV file
 * @access  Private
 */
router.delete('/cv', authenticateStudent, studentController.deleteCV);

/**
 * @route   POST /api/v1/students/profile-picture
 * @desc    Upload profile picture
 * @access  Private
 */
router.post(
  '/profile-picture',
  authenticateStudent,
  uploadProfilePicture,
  studentController.uploadProfilePicture
);

module.exports = router;
