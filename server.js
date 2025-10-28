require('dotenv').config();
const app = require('./app');
const sequelize = require('./config/database');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5001;

// Database connection with retry logic
const connectWithRetry = async (retries = 5, delay = 5000) => {
  for (let i = 0; i < retries; i++) {
    try {
      await sequelize.authenticate();
      logger.info('PostgreSQL database connected successfully');
      return true;
    } catch (error) {
      logger.error(`Database connection attempt ${i + 1} failed:`, error.message);
      
      if (i < retries - 1) {
        logger.info(`Retrying in ${delay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        logger.error('Max retries reached. Could not connect to database.');
        return false;
      }
    }
  }
};

// Start server
const startServer = async () => {
  try {
    // Connect to database
    const dbConnected = await connectWithRetry();
    
    if (!dbConnected) {
      logger.error('Failed to connect to database. Exiting...');
      process.exit(1);
    }

    // Sync models (optional - be careful in production)
    if (process.env.NODE_ENV === 'development') {
      // await sequelize.sync({ alter: true });
      logger.info('Database models synced');
    }

    // Start listening
    const server = app.listen(PORT, () => {
      logger.info(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   Mentora Consulting Student Web API                     ║
║                                                           ║
║   Server running on port: ${PORT}                          ║
║   Environment: ${process.env.NODE_ENV || 'development'}                               ║
║   API Prefix: ${process.env.API_PREFIX || '/api/v1'}                            ║
║                                                           ║
║   Health: http://localhost:${PORT}/health                   ║
║   API Docs: http://localhost:${PORT}${process.env.API_PREFIX || '/api/v1'}              ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);
      
      server.close(async () => {
        logger.info('HTTP server closed');
        
        try {
          await sequelize.close();
          logger.info('Database connection closed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown:', error);
          process.exit(1);
        }
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('UNHANDLED_REJECTION');
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();
