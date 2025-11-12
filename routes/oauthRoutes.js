const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const { connectDB } = require('../config/mongodb');

// Middleware to ensure MongoDB connection for OAuth routes
const ensureDBConnection = async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    logger.error('Failed to connect to MongoDB in OAuth route:', error);
    res.redirect(`${process.env.FRONTEND_URL}/auth?error=database_connection_failed`);
  }
};

// Helper function to generate JWT token
const generateToken = (student) => {
  return jwt.sign(
    { 
      studentId: student._id,
      email: student.email 
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

const generateRefreshToken = (student) => {
  return jwt.sign(
    { 
      studentId: student._id,
      email: student.email,
      type: 'refresh'
    },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' }
  );
};

// Google OAuth Routes
router.get('/google', ensureDBConnection, (req, res, next) => {
  // Check if Google OAuth is configured
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    logger.error('Google OAuth not configured');
    return res.redirect(`${process.env.FRONTEND_URL}/auth?error=google_not_configured`);
  }
  
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    session: false 
  })(req, res, next);
});

router.get('/google/callback',
  ensureDBConnection,
  passport.authenticate('google', { 
    failureRedirect: `${process.env.FRONTEND_URL}/auth?error=google_auth_failed`,
    session: false 
  }),
  (req, res) => {
    try {
      const token = generateToken(req.user);
      const refreshToken = generateRefreshToken(req.user);
      const isNewUser = !req.user.profileCompleted;
      
      logger.info('Google OAuth success:', { 
        studentId: req.user._id, 
        isNewUser,
        profileCompleted: req.user.profileCompleted 
      });
      
      // Redirect to frontend with tokens and profile completion status
      res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}&refreshToken=${refreshToken}&provider=google&isNewUser=${isNewUser}`);
    } catch (error) {
      logger.error('Error generating tokens after Google OAuth:', error);
      res.redirect(`${process.env.FRONTEND_URL}/auth?error=token_generation_failed`);
    }
  }
);

// Facebook OAuth Routes
router.get('/facebook', ensureDBConnection, (req, res, next) => {
  // Check if Facebook OAuth is configured
  if (!process.env.FACEBOOK_APP_ID || !process.env.FACEBOOK_APP_SECRET) {
    logger.error('Facebook OAuth not configured');
    return res.redirect(`${process.env.FRONTEND_URL}/auth?error=facebook_not_configured`);
  }
  
  passport.authenticate('facebook', { 
    scope: ['email'],
    session: false 
  })(req, res, next);
});

router.get('/facebook/callback',
  ensureDBConnection,
  passport.authenticate('facebook', { 
    failureRedirect: `${process.env.FRONTEND_URL}/auth?error=facebook_auth_failed`,
    session: false 
  }),
  (req, res) => {
    try {
      const token = generateToken(req.user);
      const refreshToken = generateRefreshToken(req.user);
      const isNewUser = !req.user.profileCompleted;
      
      logger.info('Facebook OAuth success:', { 
        studentId: req.user._id,
        isNewUser,
        profileCompleted: req.user.profileCompleted 
      });
      
      // Redirect to frontend with tokens and profile completion status
      res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}&refreshToken=${refreshToken}&provider=facebook&isNewUser=${isNewUser}`);
    } catch (error) {
      logger.error('Error generating tokens after Facebook OAuth:', error);
      res.redirect(`${process.env.FRONTEND_URL}/auth?error=token_generation_failed`);
    }
  }
);

// LinkedIn OAuth Routes
router.get('/linkedin', ensureDBConnection, (req, res, next) => {
  // Check if LinkedIn OAuth is configured
  if (!process.env.LINKEDIN_CLIENT_ID || !process.env.LINKEDIN_CLIENT_SECRET) {
    logger.error('LinkedIn OAuth not configured');
    return res.redirect(`${process.env.FRONTEND_URL}/auth?error=linkedin_not_configured`);
  }
  
  passport.authenticate('linkedin', { 
    scope: ['openid', 'profile', 'email'],
    session: false 
  })(req, res, next);
});

router.get('/linkedin/callback',
  ensureDBConnection,
  passport.authenticate('linkedin', { 
    failureRedirect: `${process.env.FRONTEND_URL}/auth?error=linkedin_auth_failed`,
    session: false 
  }),
  (req, res) => {
    try {
      const token = generateToken(req.user);
      const refreshToken = generateRefreshToken(req.user);
      const isNewUser = !req.user.profileCompleted;
      
      logger.info('LinkedIn OAuth success:', { 
        studentId: req.user._id,
        isNewUser,
        profileCompleted: req.user.profileCompleted 
      });
      
      // Redirect to frontend with tokens and profile completion status
      res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}&refreshToken=${refreshToken}&provider=linkedin&isNewUser=${isNewUser}`);
    } catch (error) {
      logger.error('Error generating tokens after LinkedIn OAuth:', error);
      res.redirect(`${process.env.FRONTEND_URL}/auth?error=token_generation_failed`);
    }
  }
);

// Twitter/X OAuth Routes (optional - requires different strategy)
// Uncomment and configure if needed
/*
router.get('/twitter',
  passport.authenticate('twitter', { session: false })
);

router.get('/twitter/callback',
  passport.authenticate('twitter', { 
    failureRedirect: `${process.env.FRONTEND_URL}/auth?error=twitter_auth_failed`,
    session: false 
  }),
  (req, res) => {
    try {
      const token = generateToken(req.user);
      const refreshToken = generateRefreshToken(req.user);
      
      logger.info('Twitter OAuth success:', { studentId: req.user._id });
      
      res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}&refreshToken=${refreshToken}&provider=twitter`);
    } catch (error) {
      logger.error('Error generating tokens after Twitter OAuth:', error);
      res.redirect(`${process.env.FRONTEND_URL}/auth?error=token_generation_failed`);
    }
  }
);
*/

module.exports = router;
