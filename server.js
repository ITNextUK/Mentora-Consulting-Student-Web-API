require('dotenv').config();
const app = require('./app');
const { connectDB, closeDB } = require('./config/mongodb');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 3001;

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB (with retry logic)
    try {
      await connectDB();
    } catch (dbError) {
      logger.error('MongoDB connection failed, but continuing in serverless mode:', dbError.message);
      // In serverless environment, we'll retry connection on each request
      if (process.env.VERCEL !== '1') {
        throw dbError;
      }
    }

    // Start listening
    const server = app.listen(PORT, () => {
      logger.info(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   Mentora Consulting Student Web API (MongoDB)           ║
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
          await closeDB();
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

// Export for Vercel serverless functions
module.exports = app;
