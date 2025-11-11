const Student = require('../models/StudentMongo');
const { createSuccessResponse, createErrorResponse } = require('../utils/responseHelper');
const { deleteFile } = require('../middlewares/fileUpload');
const CVExtractionService = require('../services/cvExtractionService');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs');

/**
 * Get student profile
 */
const getProfile = async (req, res) => {
  try {
    const student = req.student;

    res.json(
      createSuccessResponse('Profile retrieved successfully', student.toPublicJSON())
    );
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json(
      createErrorResponse('Failed to retrieve profile')
    );
  }
};

/**
 * Update student profile
 */
const updateProfile = async (req, res) => {
  try {
    const studentId = req.studentId;
    const updateData = req.body;

    // Find student
    const student = await Student.findById(studentId);
    
    if (!student) {
      return res.status(404).json(
        createErrorResponse('Student not found')
      );
    }

    // Update fields
    if (updateData.firstName) student.firstName = updateData.firstName;
    if (updateData.lastName) student.lastName = updateData.lastName;
    if (updateData.phone) student.phone = updateData.phone;
    if (updateData.dateOfBirth) student.dateOfBirth = updateData.dateOfBirth;
    if (updateData.gender) student.gender = updateData.gender;
    if (updateData.nationality) student.nationality = updateData.nationality;
    if (updateData.address) student.address = updateData.address;
    if (updateData.city) student.city = updateData.city;
    if (updateData.postalCode) student.postalCode = updateData.postalCode;
    if (updateData.country) student.country = updateData.country;
    if (updateData.degree) student.degree = updateData.degree;
    if (updateData.institution) student.institution = updateData.institution;
    if (updateData.graduationYear) student.graduationYear = updateData.graduationYear;
    if (updateData.gpa) student.gpa = updateData.gpa;
    if (updateData.ieltsScore) student.ieltsScore = updateData.ieltsScore;
    if (updateData.englishLevel) student.englishLevel = updateData.englishLevel;
    
    // Handle both githubUrl and github (frontend sends 'github')
    // Allow empty strings to clear the field
    if (updateData.githubUrl !== undefined) student.githubUrl = updateData.githubUrl;
    if (updateData.github !== undefined) student.githubUrl = updateData.github;
    if (updateData.linkedinUrl !== undefined) student.linkedinUrl = updateData.linkedinUrl;
    if (updateData.linkedin !== undefined) student.linkedinUrl = updateData.linkedin;
    if (updateData.portfolioUrl !== undefined) student.portfolioUrl = updateData.portfolioUrl;
    if (updateData.portfolio !== undefined) student.portfolioUrl = updateData.portfolio;
    
    // Update arrays
    if (updateData.education) student.education = updateData.education;
    if (updateData.qualifications) student.qualifications = updateData.qualifications;
    if (updateData.englishProficiency !== undefined) student.englishProficiency = updateData.englishProficiency;
    if (updateData.projects) student.projects = updateData.projects;
    if (updateData.workExperience) student.workExperience = updateData.workExperience;
    if (updateData.skills) student.skills = updateData.skills;
    if (updateData.coursesOfInterest) student.coursesOfInterest = updateData.coursesOfInterest;
    if (updateData.locationInterests) student.locationInterests = updateData.locationInterests;
    
    // Mark profile as completed if enough data is provided
    if (student.firstName && student.lastName && student.email && student.phone) {
      student.profileCompleted = true;
    }

    await student.save();

    logger.info(`Profile updated: ${studentId}`);

    res.json(
      createSuccessResponse('Profile updated successfully', student.toPublicJSON())
    );
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json(
      createErrorResponse('Failed to update profile', error.message)
    );
  }
};

/**
 * Upload CV
 */
const uploadCV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json(
        createErrorResponse('No file uploaded')
      );
    }

    const studentId = req.studentId;
    
    // Check if this is a Vercel Blob URL or local file path
    const isBlob = req.file.isBlob || req.file.path.startsWith('http');
    let cvPath;
    
    if (isBlob) {
      // On Vercel, req.file.path is already a Blob URL
      cvPath = req.file.path;
      logger.info(`Uploading CV to Blob Storage for student ${studentId}`);
      logger.info(`  Blob URL: ${cvPath}`);
    } else {
      // Local development - store relative path from project root
      const absolutePath = req.file.path.replace(/\\/g, '/'); // Normalize path separators
      const projectRoot = path.join(__dirname, '..').replace(/\\/g, '/');
      cvPath = absolutePath.replace(projectRoot + '/', ''); // Remove project root to get relative path
      
      logger.info(`Uploading CV locally for student ${studentId}`);
      logger.info(`  Absolute path: ${absolutePath}`);
      logger.info(`  Project root: ${projectRoot}`);
      logger.info(`  Relative path (saving to DB): ${cvPath}`);
    }

    // Get current student
    const student = await Student.findById(studentId);
    
    if (!student) {
      return res.status(404).json(
        createErrorResponse('Student not found')
      );
    }
    
    // Delete old CV if exists (only for local files, not Blob URLs)
    if (student.cvPath && !student.cvPath.startsWith('http')) {
      const oldPath = path.join(__dirname, '..', student.cvPath);
      deleteFile(oldPath);
    }

    // Update CV path
    student.cvPath = cvPath;
    await student.save();

    logger.info(`CV uploaded and saved to DB: ${studentId}, cvPath: ${student.cvPath}`);

    res.json(
      createSuccessResponse('CV uploaded successfully', {
        cvPath,
        fileName: req.file.originalname || req.file.filename,
        isBlob
      })
    );
  } catch (error) {
    logger.error('CV upload error:', error);
    
    // Delete uploaded file on error (only for local files)
    if (req.file && !req.file.isBlob) {
      deleteFile(req.file.path);
    }
    
    res.status(500).json(
      createErrorResponse('Failed to upload CV', error.message)
    );
  }
};

/**
 * Extract data from CV
 */
const extractCVData = async (req, res) => {
  try {
    const studentId = req.studentId;
    logger.info(`Extracting CV for student: ${studentId}`);
    
    const student = await Student.findById(studentId);

    if (!student) {
      logger.error(`Student not found: ${studentId}`);
      return res.status(404).json(
        createErrorResponse('Student not found')
      );
    }

    logger.info(`Student cvPath from DB: ${student.cvPath}`);

    if (!student.cvPath) {
      logger.error(`No cvPath for student: ${studentId}`);
      return res.status(400).json(
        createErrorResponse('No CV file found. Please upload a CV first.')
      );
    }

    // Check if this is a Blob URL (for Vercel) or local file path
    const isBlob = student.cvPath.startsWith('http');
    let cvFilePath;
    
    if (isBlob) {
      // For Blob URLs, pass the URL directly to the extraction service
      cvFilePath = student.cvPath;
      logger.info(`Using Blob URL for extraction: ${cvFilePath}`);
    } else {
      // For local files, construct the full path
      cvFilePath = path.join(__dirname, '..', student.cvPath);
      logger.info(`Full CV file path: ${cvFilePath}`);
      
      // Check if file exists (only for local files)
      if (!fs.existsSync(cvFilePath)) {
        logger.error(`CV file not found at path: ${cvFilePath}`);
        logger.error(`Attempted path construction: __dirname='${__dirname}', cvPath='${student.cvPath}'`);
        return res.status(404).json(
          createErrorResponse('CV file not found on server. Please upload again.')
        );
      }
    }

    logger.info(`Extracting CV data from: ${cvFilePath}`);

    // Extract CV data
    const result = await CVExtractionService.extractCvData(cvFilePath);

    if (!result.success) {
      logger.error(`CV extraction failed: ${result.error}`);
      return res.status(500).json(
        createErrorResponse('Failed to extract CV data', result.error)
      );
    }

    logger.info(`CV data extracted: ${studentId}`);

    res.json(
      createSuccessResponse('CV data extracted successfully', result.data)
    );
  } catch (error) {
    logger.error('CV extraction error:', error);
    res.status(500).json(
      createErrorResponse('Failed to extract CV data', error.message)
    );
  }
};

/**
 * Delete CV
 */
const deleteCV = async (req, res) => {
  try {
    const studentId = req.studentId;
    const student = await Student.findById(studentId);

    if (!student) {
      return res.status(404).json(
        createErrorResponse('Student not found')
      );
    }

    if (!student.cvPath) {
      return res.status(400).json(
        createErrorResponse('No CV file to delete')
      );
    }

    // Delete file
    const cvFilePath = path.join(__dirname, '..', student.cvPath);
    deleteFile(cvFilePath);

    // Update database
    student.cvPath = undefined;
    await student.save();

    logger.info(`CV deleted: ${studentId}`);

    res.json(
      createSuccessResponse('CV deleted successfully')
    );
  } catch (error) {
    logger.error('CV deletion error:', error);
    res.status(500).json(
      createErrorResponse('Failed to delete CV', error.message)
    );
  }
};

/**
 * Upload profile picture
 */
const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json(
        createErrorResponse('No file uploaded')
      );
    }

    const studentId = req.studentId;
    const profilePicturePath = req.file.path;

    // Get current student
    const student = await Student.findById(studentId);
    
    if (!student) {
      // Delete uploaded file if student not found
      deleteFile(profilePicturePath);
      return res.status(404).json(
        createErrorResponse('Student not found')
      );
    }
    
    // Delete old profile picture if exists
    if (student.profilePicture) {
      deleteFile(path.join(__dirname, '..', student.profilePicture));
    }

    // Update profile picture path
    student.profilePicture = profilePicturePath;
    await student.save();

    logger.info(`Profile picture uploaded: ${studentId}`);

    res.json(
      createSuccessResponse('Profile picture uploaded successfully', {
        profilePicturePath,
        fileName: req.file.filename
      })
    );
  } catch (error) {
    logger.error('Profile picture upload error:', error);
    
    // Delete uploaded file on error
    if (req.file) {
      deleteFile(req.file.path);
    }
    
    res.status(500).json(
      createErrorResponse('Failed to upload profile picture', error.message)
    );
  }
};

module.exports = {
  getProfile,
  updateProfile,
  uploadCV,
  extractCVData,
  deleteCV,
  uploadProfilePicture
};
