/**
 * Student Model - MongoDB/Mongoose
 * Replaces Sequelize Student model
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const studentSchema = new mongoose.Schema({
  // Personal Information
  firstName: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  phone: {
    type: String,
    trim: true
  },
  dateOfBirth: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other', 'Prefer not to say']
  },
  nationality: {
    type: String,
    trim: true
  },
  
  // Address Information
  address: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  postalCode: {
    type: String,
    trim: true
  },
  country: {
    type: String,
    trim: true
  },
  
  // Education Information
  degree: {
    type: String,
    trim: true
  },
  institution: {
    type: String,
    trim: true
  },
  graduationYear: {
    type: String,
    trim: true
  },
  gpa: {
    type: String,
    trim: true
  },
  ieltsScore: {
    type: String,
    trim: true
  },
  
  // Education Array (for multiple degrees)
  education: [{
    degree: String,
    institution: String,
    graduationYear: String,
    gpa: String,
    fieldOfStudy: String
  }],
  
  // Work Experience
  workExperience: [{
    company: String,
    position: String,
    startDate: String,
    endDate: String,
    description: String,
    current: Boolean
  }],
  
  // Skills
  skills: [{
    type: String,
    trim: true
  }],
  
  // Courses of Interest
  coursesOfInterest: [{
    type: String,
    trim: true
  }],
  
  // Location Interests (UK cities)
  locationInterests: [{
    type: String,
    trim: true
  }],
  
  // References/Links
  githubUrl: {
    type: String,
    trim: true
  },
  linkedinUrl: {
    type: String,
    trim: true
  },
  portfolioUrl: {
    type: String,
    trim: true
  },
  
  // File Paths
  cvPath: {
    type: String,
    trim: true
  },
  profilePicture: {
    type: String,
    trim: true
  },
  
  // Profile Status
  profileCompleted: {
    type: Boolean,
    default: false
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  
  // Password Reset
  resetPasswordToken: {
    type: String
  },
  resetPasswordExpires: {
    type: Date
  },
  
  // Account Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  
  // Timestamps
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt
  collection: 'students'
});

// Indexes
// Note: email index is already created by unique: true constraint
studentSchema.index({ createdAt: -1 });

// Virtual for full name
studentSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Hash password before saving
studentSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
studentSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get public profile (exclude sensitive data)
studentSchema.methods.toPublicJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpires;
  return obj;
};

const Student = mongoose.model('Student', studentSchema);

module.exports = Student;
