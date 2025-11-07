const mongoose = require('mongoose');

const universityCourseSchema = new mongoose.Schema({
  // Basic Information
  universityId: { type: String, required: true },
  universityName: { type: String, required: true },
  courseId: { type: String, required: true, unique: true },
  courseName: { type: String, required: true },
  courseCode: { type: String },
  degreeLevel: { type: String }, // Bachelors, Masters, PhD
  studyMode: { type: String }, // Full-time, Part-time
  durationYears: { type: Number },
  courseUrl: { type: String },
  courseDescription: { type: String },
  status: { type: String, default: 'Active' },
  
  // Location Information
  city: { type: String },
  region: { type: String },
  country: { type: String, default: 'United Kingdom' },

  // Fees & Intakes
  tuitionFeeLocal: { type: Number },
  tuitionFeeInternational: { type: Number },
  startDate1: { type: String },
  startDate2: { type: String },
  applicationDeadline: { type: String },
  scholarshipAvailable: { type: String },
  scholarshipAmount: { type: String },

  // Entry Requirements
  academicRequirements: { type: String },
  minimumGpa: { type: String },
  ieltsOverall: { type: Number },
  ieltsReading: { type: Number },
  ieltsWriting: { type: Number },
  ieltsListening: { type: Number },
  ieltsSpeaking: { type: Number },
  toeflOverall: { type: Number },
  pteOverall: { type: Number },
  prerequisites: { type: String },
  workExperience: { type: String },
  otherRequirements: { type: String },

  // Metadata
  importedAt: { type: Date, default: Date.now },
  lastUpdated: { type: Date, default: Date.now }
}, {
  timestamps: true,
  collection: 'universitycourses'
});

// Indexes for better query performance
universityCourseSchema.index({ universityName: 1 });
universityCourseSchema.index({ degreeLevel: 1 });
universityCourseSchema.index({ tuitionFeeInternational: 1 });
universityCourseSchema.index({ ieltsOverall: 1 });
universityCourseSchema.index({ courseId: 1 }, { unique: true });
universityCourseSchema.index({ city: 1 });
universityCourseSchema.index({ region: 1 });

// Text search index for course name and description
universityCourseSchema.index({ courseName: 'text', courseDescription: 'text' });

const UniversityCourse = mongoose.model('UniversityCourse', universityCourseSchema);

module.exports = UniversityCourse;
