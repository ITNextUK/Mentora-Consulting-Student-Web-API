const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { put } = require('@vercel/blob');
const { createErrorResponse } = require('../utils/responseHelper');

// Check if running on Vercel (serverless environment)
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;

// Ensure upload directories exist (skip on Vercel - read-only filesystem)
const uploadDirs = {
  cv: path.join(__dirname, '../uploads/cv'),
  profilePictures: path.join(__dirname, '../uploads/profilePictures')
};

if (!isVercel) {
  // Only create directories if NOT on Vercel (local/traditional server)
  Object.values(uploadDirs).forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
  console.log('📁 Local file upload directories ready');
} else {
  console.log('☁️  Using Vercel Blob Storage for file uploads');
}

// Storage configuration - use memory storage on Vercel, disk storage locally
const storageConfig = isVercel 
  ? multer.memoryStorage() // Store files in memory for Vercel Blob upload
  : multer.diskStorage({   // Store files on disk for local development
      destination: (req, file, cb) => {
        const dir = file.fieldname === 'cv' ? uploadDirs.cv : uploadDirs.profilePictures;
        cb(null, dir);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const prefix = file.fieldname === 'cv' ? 'cv' : 'profile';
        cb(null, `${prefix}-${req.studentId}-${uniqueSuffix}${ext}`);
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
  storage: storageConfig,
  fileFilter: cvFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
}).single('cv');

const uploadProfilePicture = multer({
  storage: storageConfig,
  fileFilter: profilePictureFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
}).single('profilePicture');

// Upload to Vercel Blob Storage
async function uploadToVercelBlob(file, folder) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error('BLOB_READ_WRITE_TOKEN environment variable is not set');
  }

  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const ext = path.extname(file.originalname);
  const fileName = `${folder}/${file.fieldname}-${uniqueSuffix}${ext}`;

  const blob = await put(fileName, file.buffer, {
    access: 'public',
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });

  return blob.url;
}

// Error handling wrapper
const handleUploadError = (uploadFn, folder) => {
  return async (req, res, next) => {
    uploadFn(req, res, async (err) => {
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

      // If on Vercel, upload to Blob Storage
      if (isVercel && req.file) {
        try {
          const blobUrl = await uploadToVercelBlob(req.file, folder);
          req.file.path = blobUrl; // Store blob URL in file.path for consistency
          req.file.isBlob = true; // Flag to indicate this is a blob URL
        } catch (blobError) {
          console.error('Error uploading to Vercel Blob:', blobError);
          return res.status(500).json(
            createErrorResponse('Failed to upload file to cloud storage')
          );
        }
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
  uploadCV: handleUploadError(uploadCV, 'cv'),
  uploadProfilePicture: handleUploadError(uploadProfilePicture, 'profile-pictures'),
  deleteFile,
  uploadDirs,
  isVercel
};
