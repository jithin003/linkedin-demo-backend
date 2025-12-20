const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profile.controller');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { upload, handleMulterError } = require('../middleware/upload');

// Get profile (optional auth - can view others' profiles)
router.get('/:id?', optionalAuth, profileController.getProfile);

// Update profile (authenticated)
router.put('/', authenticateToken, profileController.updateProfile);

// Upload profile picture
router.post('/profile-picture', authenticateToken, upload.single('profile'), handleMulterError, profileController.uploadProfilePicture);

// Upload cover image
router.post('/cover-image', authenticateToken, upload.single('cover'), handleMulterError, profileController.uploadCoverImage);

// Skills
router.post('/skills', authenticateToken, profileController.addSkill);
router.delete('/skills/:id', authenticateToken, profileController.removeSkill);

// Experience
router.post('/experience', authenticateToken, profileController.addExperience);
router.put('/experience/:id', authenticateToken, profileController.updateExperience);
router.delete('/experience/:id', authenticateToken, profileController.deleteExperience);

// Education
router.post('/education', authenticateToken, profileController.addEducation);
router.put('/education/:id', authenticateToken, profileController.updateEducation);
router.delete('/education/:id', authenticateToken, profileController.deleteEducation);

module.exports = router;
