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
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000,
    });

    logger.info('MongoDB connected successfully', { service: 'mentora-student-api' });
    
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', { error: err.message, service: 'mentora-student-api' });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected', { service: 'mentora-student-api' });
    });

  } catch (error) {
    logger.error('Failed to connect to MongoDB:', { error: error.message, service: 'mentora-student-api' });
    
    // Don't exit process on Vercel (serverless environment)
    if (process.env.VERCEL !== '1') {
      process.exit(1);
    } else {
      logger.warn('Running in serverless environment, continuing despite MongoDB connection error');
      throw error; // Re-throw to let caller handle it
    }
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
