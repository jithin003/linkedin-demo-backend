const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profile.controller');
const { authenticate } = require('../middleware/auth');
const { upload, handleMulterError } = require('../middleware/upload');

// Get profile
router.get('/:id?', profileController.getProfile);

// Update profile (authenticated)
router.put('/', authenticate, profileController.updateProfile);

// Upload profile picture
router.post('/profile-picture', authenticate, upload.single('profile'), handleMulterError, profileController.uploadProfilePicture);

// Upload cover image
router.post('/cover-image', authenticate, upload.single('cover'), handleMulterError, profileController.uploadCoverImage);

// Skills
router.post('/skills', authenticate, profileController.addSkill);
router.delete('/skills/:id', authenticate, profileController.removeSkill);

// Experience
router.post('/experience', authenticate, profileController.addExperience);
router.put('/experience/:id', authenticate, profileController.updateExperience);
router.delete('/experience/:id', authenticate, profileController.deleteExperience);

// Education
router.post('/education', authenticate, profileController.addEducation);
router.put('/education/:id', authenticate, profileController.updateEducation);
router.delete('/education/:id', authenticate, profileController.deleteEducation);

module.exports = router;
