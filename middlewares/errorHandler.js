const { createErrorResponse } = require('../utils/responseHelper');
const logger = require('../utils/logger');

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log error
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    studentId: req.studentId || 'N/A'
  });

  // Sequelize validation errors
  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map(e => ({
      field: e.path,
      message: e.message
    }));
    return res.status(400).json(
      createErrorResponse('Validation error', errors)
    );
  }

  // Sequelize unique constraint error
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json(
      createErrorResponse('Resource already exists', err.errors[0].message)
    );
  }

  // Sequelize foreign key constraint error
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json(
      createErrorResponse('Invalid reference to related resource')
    );
  }

  // Sequelize database error
  if (err.name === 'SequelizeDatabaseError') {
    return res.status(500).json(
      createErrorResponse('Database error occurred')
    );
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json(
      createErrorResponse('Invalid token')
    );
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json(
      createErrorResponse('Token expired')
    );
  }

  // Multer file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json(
      createErrorResponse('File size exceeds limit')
    );
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json(
      createErrorResponse('Unexpected file field')
    );
  }

  // Default error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json(
    createErrorResponse(
      message,
      process.env.NODE_ENV === 'development' ? err.stack : undefined
    )
  );
};

/**
 * 404 Not Found handler
 */
const notFoundHandler = (req, res) => {
  res.status(404).json(
    createErrorResponse(`Cannot ${req.method} ${req.path}`)
  );
};

module.exports = {
  errorHandler,
  notFoundHandler
};
