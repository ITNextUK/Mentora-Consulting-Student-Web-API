const { Student } = require('../models');
const { createSuccessResponse, createErrorResponse } = require('../utils/responseHelper');
const { deleteFile } = require('../middlewares/fileUpload');
const CVExtractionService = require('../services/cvExtractionService');
const logger = require('../utils/logger');
const path = require('path');

/**
 * Get student profile
 */
const getProfile = async (req, res) => {
  try {
    const student = req.student;

    res.json(
      createSuccessResponse('Profile retrieved successfully', student.toJSON())
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

    // Get current student data
    const student = await Student.findByPk(studentId);
    
    if (!student) {
      return res.status(404).json(
        createErrorResponse('Student not found')
      );
    }

    // Merge update data with existing data
    const mergedData = {
      studentId: student.studentId,
      firstName: updateData.firstName || student.firstName,
      lastName: updateData.lastName || student.lastName,
      email: updateData.email || student.email,
      phone: updateData.phone || student.phone,
      nic: updateData.nic || student.nic,
      dateOfBirth: updateData.dateOfBirth || student.dateOfBirth,
      gender: updateData.gender || student.gender,
      address: updateData.address || student.address,
      city: updateData.city || student.city,
      country: updateData.country || student.country,
      profilePicturePath: updateData.profilePicturePath || student.profilePicturePath,
      degree: updateData.degree || student.degree,
      institution: updateData.institution || student.institution,
      graduationYear: updateData.graduationYear || student.graduationYear,
      gpa: updateData.gpa || student.gpa,
      ieltsScore: updateData.ieltsScore || student.ieltsScore,
      englishLevel: updateData.englishLevel || student.englishLevel,
      workExperience: updateData.workExperience || student.workExperience || [],
      skills: updateData.skills || student.skills || [],
      coursesOfInterest: updateData.coursesOfInterest || student.coursesOfInterest || [],
      locationInterests: updateData.locationInterests || student.locationInterests || [],
      github: updateData.github || student.github,
      linkedin: updateData.linkedin || student.linkedin,
      portfolio: updateData.portfolio || student.portfolio,
      cvPath: updateData.cvPath || student.cvPath,
      passwordHash: student.passwordHash,
      status: student.status
    };

    // Update using stored procedure
    await Student.sequelize.query(
      `SELECT mentora_ref.sp_ref_student_modify(
        :studentId, :firstName, :lastName, :email, :phone,
        :nic, :dateOfBirth, :gender, :address, :city, :country, :profilePicturePath,
        :degree, :institution, :graduationYear, :gpa, :ieltsScore, :englishLevel,
        :workExperience, :skills, :coursesOfInterest, :locationInterests,
        :github, :linkedin, :portfolio, :cvPath,
        :passwordHash, :status, :studentId
      )`,
      {
        replacements: {
          ...mergedData,
          workExperience: JSON.stringify(mergedData.workExperience),
          skills: JSON.stringify(mergedData.skills),
          coursesOfInterest: JSON.stringify(mergedData.coursesOfInterest),
          locationInterests: JSON.stringify(mergedData.locationInterests)
        },
        type: Student.sequelize.QueryTypes.SELECT
      }
    );

    // Fetch updated student
    const updatedStudent = await Student.findByPk(studentId);

    logger.info(`Profile updated: ${studentId}`);

    res.json(
      createSuccessResponse('Profile updated successfully', updatedStudent.toJSON())
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
    const cvPath = req.file.path;

    // Get current student
    const student = await Student.findByPk(studentId);
    
    // Delete old CV if exists
    if (student.cvPath) {
      deleteFile(path.join(__dirname, '..', student.cvPath));
    }

    // Update CV path using stored procedure
    await Student.sequelize.query(
      `SELECT mentora_ref.sp_ref_student_modify(
        :studentId, :firstName, :lastName, :email, :phone,
        :nic, :dateOfBirth, :gender, :address, :city, :country, :profilePicturePath,
        :degree, :institution, :graduationYear, :gpa, :ieltsScore, :englishLevel,
        :workExperience, :skills, :coursesOfInterest, :locationInterests,
        :github, :linkedin, :portfolio, :cvPath,
        :passwordHash, :status, :studentId
      )`,
      {
        replacements: {
          studentId: student.studentId,
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email,
          phone: student.phone,
          nic: student.nic,
          dateOfBirth: student.dateOfBirth,
          gender: student.gender,
          address: student.address,
          city: student.city,
          country: student.country,
          profilePicturePath: student.profilePicturePath,
          degree: student.degree,
          institution: student.institution,
          graduationYear: student.graduationYear,
          gpa: student.gpa,
          ieltsScore: student.ieltsScore,
          englishLevel: student.englishLevel,
          workExperience: JSON.stringify(student.workExperience || []),
          skills: JSON.stringify(student.skills || []),
          coursesOfInterest: JSON.stringify(student.coursesOfInterest || []),
          locationInterests: JSON.stringify(student.locationInterests || []),
          github: student.github,
          linkedin: student.linkedin,
          portfolio: student.portfolio,
          cvPath,
          passwordHash: student.passwordHash,
          status: student.status
        },
        type: Student.sequelize.QueryTypes.SELECT
      }
    );

    logger.info(`CV uploaded: ${studentId}`);

    res.json(
      createSuccessResponse('CV uploaded successfully', {
        cvPath,
        fileName: req.file.filename
      })
    );
  } catch (error) {
    logger.error('CV upload error:', error);
    
    // Delete uploaded file on error
    if (req.file) {
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
    const student = await Student.findByPk(studentId);

    if (!student.cvPath) {
      return res.status(400).json(
        createErrorResponse('No CV file found. Please upload a CV first.')
      );
    }

    const cvFilePath = path.join(__dirname, '..', student.cvPath);

    // Extract CV data
    const result = await CVExtractionService.extractCvData(cvFilePath);

    if (!result.success) {
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
    const student = await Student.findByPk(studentId);

    if (!student.cvPath) {
      return res.status(400).json(
        createErrorResponse('No CV file to delete')
      );
    }

    // Delete file
    const cvFilePath = path.join(__dirname, '..', student.cvPath);
    deleteFile(cvFilePath);

    // Update database
    await Student.sequelize.query(
      `SELECT mentora_ref.sp_ref_student_modify(
        :studentId, :firstName, :lastName, :email, :phone,
        :nic, :dateOfBirth, :gender, :address, :city, :country, :profilePicturePath,
        :degree, :institution, :graduationYear, :gpa, :ieltsScore, :englishLevel,
        :workExperience, :skills, :coursesOfInterest, :locationInterests,
        :github, :linkedin, :portfolio, NULL,
        :passwordHash, :status, :studentId
      )`,
      {
        replacements: {
          studentId: student.studentId,
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email,
          phone: student.phone,
          nic: student.nic,
          dateOfBirth: student.dateOfBirth,
          gender: student.gender,
          address: student.address,
          city: student.city,
          country: student.country,
          profilePicturePath: student.profilePicturePath,
          degree: student.degree,
          institution: student.institution,
          graduationYear: student.graduationYear,
          gpa: student.gpa,
          ieltsScore: student.ieltsScore,
          englishLevel: student.englishLevel,
          workExperience: JSON.stringify(student.workExperience || []),
          skills: JSON.stringify(student.skills || []),
          coursesOfInterest: JSON.stringify(student.coursesOfInterest || []),
          locationInterests: JSON.stringify(student.locationInterests || []),
          github: student.github,
          linkedin: student.linkedin,
          portfolio: student.portfolio,
          passwordHash: student.passwordHash,
          status: student.status
        },
        type: Student.sequelize.QueryTypes.SELECT
      }
    );

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
    const student = await Student.findByPk(studentId);
    
    // Delete old profile picture if exists
    if (student.profilePicturePath) {
      deleteFile(path.join(__dirname, '..', student.profilePicturePath));
    }

    // Update profile picture path
    await Student.sequelize.query(
      `SELECT mentora_ref.sp_ref_student_modify(
        :studentId, :firstName, :lastName, :email, :phone,
        :nic, :dateOfBirth, :gender, :address, :city, :country, :profilePicturePath,
        :degree, :institution, :graduationYear, :gpa, :ieltsScore, :englishLevel,
        :workExperience, :skills, :coursesOfInterest, :locationInterests,
        :github, :linkedin, :portfolio, :cvPath,
        :passwordHash, :status, :studentId
      )`,
      {
        replacements: {
          studentId: student.studentId,
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email,
          phone: student.phone,
          nic: student.nic,
          dateOfBirth: student.dateOfBirth,
          gender: student.gender,
          address: student.address,
          city: student.city,
          country: student.country,
          profilePicturePath,
          degree: student.degree,
          institution: student.institution,
          graduationYear: student.graduationYear,
          gpa: student.gpa,
          ieltsScore: student.ieltsScore,
          englishLevel: student.englishLevel,
          workExperience: JSON.stringify(student.workExperience || []),
          skills: JSON.stringify(student.skills || []),
          coursesOfInterest: JSON.stringify(student.coursesOfInterest || []),
          locationInterests: JSON.stringify(student.locationInterests || []),
          github: student.github,
          linkedin: student.linkedin,
          portfolio: student.portfolio,
          cvPath: student.cvPath,
          passwordHash: student.passwordHash,
          status: student.status
        },
        type: Student.sequelize.QueryTypes.SELECT
      }
    );

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
