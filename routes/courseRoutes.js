const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { authenticateStudent } = require('../middlewares/auth');

/**
 * @route   POST /api/v1/courses/ranked
 * @desc    Get ranked courses based on student profile
 * @access  Private
 */
router.post('/ranked', authenticateStudent, courseController.getRankedCourses);

/**
 * @route   GET /api/v1/courses/meta/universities
 * @desc    Get all universities
 * @access  Public
 */
router.get('/meta/universities', courseController.getUniversities);

/**
 * @route   GET /api/v1/courses/meta/degree-levels
 * @desc    Get all degree levels
 * @access  Public
 */
router.get('/meta/degree-levels', courseController.getDegreeLevels);

/**
 * @route   GET /api/v1/courses/meta/stats
 * @desc    Get course statistics
 * @access  Public
 */
router.get('/meta/stats', courseController.getCourseStats);

/**
 * @route   GET /api/v1/courses/:courseId
 * @desc    Get course by ID
 * @access  Public
 */
router.get('/:courseId', courseController.getCourseById);

module.exports = router;
