const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { createErrorResponse } = require('../utils/responseHelper');

// Ensure upload directories exist
const uploadDirs = {
  cv: path.join(__dirname, '../uploads/cv'),
  profilePictures: path.join(__dirname, '../uploads/profilePictures')
};

Object.values(uploadDirs).forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// CV Storage Configuration
const cvStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirs.cv);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'cv-' + req.studentId + '-' + uniqueSuffix + ext);
  }
});

// Profile Picture Storage Configuration
const profilePictureStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirs.profilePictures);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'profile-' + req.studentId + '-' + uniqueSuffix + ext);
  }
});

// File Filter for CV (PDF, DOC, DOCX)
const cvFileFilter = (req, file, cb) => {
  const allowedMimes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  const allowedExts = ['.pdf', '.doc', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedMimes.includes(file.mimetype) && allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, DOC, and DOCX files are allowed for CV upload'), false);
  }
};

// File Filter for Profile Pictures (JPG, PNG)
const profilePictureFileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/jpg'];
  const allowedExts = ['.jpg', '.jpeg', '.png'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedMimes.includes(file.mimetype) && allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG and PNG files are allowed for profile pictures'), false);
  }
};

// Multer Upload Configurations
const uploadCV = multer({
  storage: cvStorage,
  fileFilter: cvFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
}).single('cv');

const uploadProfilePicture = multer({
  storage: profilePictureStorage,
  fileFilter: profilePictureFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
}).single('profilePicture');

// Error handling wrapper
const handleUploadError = (uploadFn) => {
  return (req, res, next) => {
    uploadFn(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json(
            createErrorResponse('File size exceeds the allowed limit')
          );
        }
        return res.status(400).json(
          createErrorResponse(`Upload error: ${err.message}`)
        );
      } else if (err) {
        return res.status(400).json(
          createErrorResponse(err.message)
        );
      }
      next();
    });
  };
};

// Delete file helper
const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

module.exports = {
  uploadCV: handleUploadError(uploadCV),
  uploadProfilePicture: handleUploadError(uploadProfilePicture),
  deleteFile,
  uploadDirs
};
