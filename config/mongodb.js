/**
 * MongoDB Database Configuration
 * Replaces Sequelize/PostgreSQL for student API
 * Optimized for Vercel serverless functions
 */

const mongoose = require('mongoose');
const logger = require('../utils/logger');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://vihi:vihi@itpcluster.bhmi6vu.mongodb.net/Mentora?retryWrites=true&w=majority';

// Global variable to cache the connection for serverless
let cachedConnection = null;

/**
 * Connect to MongoDB with connection caching for serverless
 */
const connectDB = async () => {
  try {
    // Return cached connection if it exists and is connected
    if (cachedConnection && mongoose.connection.readyState === 1) {
      logger.info('Using cached MongoDB connection');
      return cachedConnection;
    }

    // Skip if already connecting
    if (mongoose.connection.readyState === 2) {
      logger.info('MongoDB connection in progress, waiting...');
      // Wait for connection to complete
      await new Promise((resolve) => {
        mongoose.connection.once('connected', resolve);
      });
      return mongoose.connection;
    }

    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000, // Timeout after 10s
      socketTimeoutMS: 45000,
      maxPoolSize: 10, // Limit connection pool for serverless
      minPoolSize: 1,
      retryWrites: true,
      w: 'majority',
      bufferCommands: false, // Disable buffering for serverless
    });

    logger.info('MongoDB connected successfully', { service: 'mentora-student-api' });
    
    // Cache the connection
    cachedConnection = mongoose.connection;
    
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', { error: err.message, service: 'mentora-student-api' });
      cachedConnection = null; // Clear cache on error
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected', { service: 'mentora-student-api' });
      cachedConnection = null; // Clear cache on disconnect
    });

    return cachedConnection;

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
