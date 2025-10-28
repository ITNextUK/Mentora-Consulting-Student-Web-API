/**
 * MongoDB Database Configuration
 * Replaces Sequelize/PostgreSQL for student API
 */

const mongoose = require('mongoose');
const logger = require('../utils/logger');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://vihi:vihi@itpcluster.bhmi6vu.mongodb.net/Mentora?retryWrites=true&w=majority';

/**
 * Connect to MongoDB
 */
const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);

    logger.info('MongoDB connected successfully', { service: 'mentora-student-api' });
    
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', { error: err.message, service: 'mentora-student-api' });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected', { service: 'mentora-student-api' });
    });

  } catch (error) {
    logger.error('Failed to connect to MongoDB:', { error: error.message, service: 'mentora-student-api' });
    process.exit(1);
  }
};

/**
 * Close MongoDB connection
 */
const closeDB = async () => {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed', { service: 'mentora-student-api' });
  } catch (error) {
    logger.error('Error closing MongoDB connection:', { error: error.message, service: 'mentora-student-api' });
  }
};

module.exports = {
  connectDB,
  closeDB,
  mongoose
};
