const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
const logger = require('../utils/logger');

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    // Lazy load Student model to avoid connection issues at startup
    const Student = require('../models/StudentMongo');
    const student = await Student.findById(id);
    done(null, student);
  } catch (error) {
    logger.error('Error deserializing user:', error);
    done(error, null);
  }
});

// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
        scope: ['profile', 'email'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Lazy load Student model to avoid connection issues at startup
          const Student = require('../models/StudentMongo');
          
          logger.info('Google OAuth callback:', { profileId: profile.id });

          // Check if student already exists
          let student = await Student.findOne({
            $or: [
              { googleId: profile.id },
              { email: profile.emails[0].value }
            ]
          });

          if (student) {
            // Update Google ID if not set
            if (!student.googleId) {
              student.googleId = profile.id;
              await student.save();
            }
            logger.info('Existing student found:', student._id);
            return done(null, student);
          }

          // Create new student
          student = await Student.create({
            googleId: profile.id,
            firstName: profile.name.givenName || profile.displayName.split(' ')[0],
            lastName: profile.name.familyName || profile.displayName.split(' ').slice(1).join(' '),
            email: profile.emails[0].value,
            profilePicture: profile.photos[0]?.value,
            emailVerified: true, // Google emails are verified
            profileCompleted: false,
          });

          logger.info('New student created via Google OAuth:', student._id);
          return done(null, student);
        } catch (error) {
          logger.error('Google OAuth error:', error);
          return done(error, null);
        }
      }
    )
  );
} else {
  logger.warn('Google OAuth credentials not configured');
}

// Facebook OAuth Strategy
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: process.env.FACEBOOK_CALLBACK_URL,
        profileFields: ['id', 'emails', 'name', 'picture.type(large)'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Lazy load Student model to avoid connection issues at startup
          const Student = require('../models/StudentMongo');
          
          logger.info('Facebook OAuth callback:', { profileId: profile.id });

          // Check if student already exists
          let student = await Student.findOne({
            $or: [
              { facebookId: profile.id },
              { email: profile.emails?.[0]?.value }
            ]
          });

          if (student) {
            // Update Facebook ID if not set
            if (!student.facebookId) {
              student.facebookId = profile.id;
              await student.save();
            }
            logger.info('Existing student found:', student._id);
            return done(null, student);
          }

          // Create new student
          student = await Student.create({
            facebookId: profile.id,
            firstName: profile.name.givenName || profile.displayName.split(' ')[0],
            lastName: profile.name.familyName || profile.displayName.split(' ').slice(1).join(' '),
            email: profile.emails?.[0]?.value,
            profilePicture: profile.photos?.[0]?.value,
            emailVerified: !!profile.emails?.[0]?.value, // Facebook may not always provide email
            profileCompleted: false,
          });

          logger.info('New student created via Facebook OAuth:', student._id);
          return done(null, student);
        } catch (error) {
          logger.error('Facebook OAuth error:', error);
          return done(error, null);
        }
      }
    )
  );
} else {
  logger.warn('Facebook OAuth credentials not configured');
}

// LinkedIn OAuth Strategy
if (process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET) {
  passport.use(
    new LinkedInStrategy(
      {
        clientID: process.env.LINKEDIN_CLIENT_ID,
        clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
        callbackURL: process.env.LINKEDIN_CALLBACK_URL,
        scope: ['openid', 'profile', 'email'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Lazy load Student model to avoid connection issues at startup
          const Student = require('../models/StudentMongo');
          
          logger.info('LinkedIn OAuth callback:', { profileId: profile.id });

          // Check if student already exists
          let student = await Student.findOne({
            $or: [
              { linkedinId: profile.id },
              { email: profile.emails?.[0]?.value }
            ]
          });

          if (student) {
            // Update LinkedIn ID if not set
            if (!student.linkedinId) {
              student.linkedinId = profile.id;
              await student.save();
            }
            logger.info('Existing student found:', student._id);
            return done(null, student);
          }

          // Create new student
          student = await Student.create({
            linkedinId: profile.id,
            firstName: profile.name.givenName || profile.displayName.split(' ')[0],
            lastName: profile.name.familyName || profile.displayName.split(' ').slice(1).join(' '),
            email: profile.emails?.[0]?.value,
            profilePicture: profile.photos?.[0]?.value,
            emailVerified: !!profile.emails?.[0]?.value,
            profileCompleted: false,
          });

          logger.info('New student created via LinkedIn OAuth:', student._id);
          return done(null, student);
        } catch (error) {
          logger.error('LinkedIn OAuth error:', error);
          return done(error, null);
        }
      }
    )
  );
} else {
  logger.warn('LinkedIn OAuth credentials not configured');
}

module.exports = passport;
