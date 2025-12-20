const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const uploadDirs = ['uploads/profiles', 'uploads/posts', 'uploads/covers'];
uploadDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let uploadPath = 'uploads/posts';

        if (req.path.includes('profile')) {
            uploadPath = 'uploads/profiles';
        } else if (req.path.includes('cover')) {
            uploadPath = 'uploads/covers';
        }

        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    const allowedImageTypes = /jpeg|jpg|png|gif|webp|bmp|svg/;
    const allowedVideoTypes = /mp4|mov|avi|wmv|webm|flv|mkv/;

    const mimetype = file.mimetype.toLowerCase();
    const extname = file.originalname ? path.extname(file.originalname).toLowerCase().slice(1) : '';

    // Check MIME type first (more reliable for web uploads)
    if (mimetype.startsWith('image/')) {
        // If it's an image MIME type, accept it
        // Extension check is optional for web uploads
        if (!extname || allowedImageTypes.test(extname)) {
            return cb(null, true);
        }
    } else if (mimetype.startsWith('video/')) {
        // If it's a video MIME type, accept it
        // Extension check is optional for web uploads
        if (!extname || allowedVideoTypes.test(extname)) {
            return cb(null, true);
        }
    }

    // Reject if not image or video
    cb(new Error('Invalid file type. Only images and videos are allowed.'));
};

// Multer configuration
const upload = multer({
    storage: storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB default
    },
    fileFilter: fileFilter
});

// Error handling middleware
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File too large. Maximum size is 10MB'
            });
        }
        return res.status(400).json({
            success: false,
            message: err.message
        });
    } else if (err) {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }
    next();
};

module.exports = { upload, handleMulterError };
