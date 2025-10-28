const jwt = require('jsonwebtoken');
const { Student } = require('../models');
const { createErrorResponse } = require('../utils/responseHelper');

/**
 * Middleware to authenticate student JWT tokens
 */
const authenticateStudent = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json(
        createErrorResponse('No token provided. Access denied.')
      );
    }

    const token = authHeader.split(' ')[1];

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Check if token contains student ID
      if (!decoded.studentId) {
        return res.status(401).json(
          createErrorResponse('Invalid token format.')
        );
      }

      // Fetch student from database
      const student = await Student.findByPk(decoded.studentId);
      
      if (!student) {
        return res.status(401).json(
          createErrorResponse('Student not found. Invalid token.')
        );
      }

      if (student.status !== 'Active') {
        return res.status(401).json(
          createErrorResponse('Student account is not active.')
        );
      }

      // Attach student to request object
      req.student = student;
      req.studentId = decoded.studentId;
      
      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json(
          createErrorResponse('Token expired. Please login again.')
        );
      } else if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json(
          createErrorResponse('Invalid token.')
        );
      }
      throw jwtError;
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json(
      createErrorResponse('Authentication failed.', error.message)
    );
  }
};

/**
 * Optional authentication - doesn't fail if no token provided
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      if (decoded.studentId) {
        const student = await Student.findByPk(decoded.studentId);
        if (student && student.status === 'Active') {
          req.student = student;
          req.studentId = decoded.studentId;
        }
      }
    } catch (jwtError) {
      // Silent fail for optional auth
      console.log('Optional auth token invalid:', jwtError.message);
    }
    
    next();
  } catch (error) {
    console.error('Optional auth error:', error);
    next();
  }
};

module.exports = {
  authenticateStudent,
  optionalAuth
};
