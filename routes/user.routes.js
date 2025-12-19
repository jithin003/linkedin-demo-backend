const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

// Routes
router.get('/profile/:id', optionalAuth, userController.getProfile);
router.put('/profile', authenticateToken, userController.updateProfile);
router.post('/profile/photo', authenticateToken, upload.single('photo'), userController.uploadProfilePhoto);
router.post('/profile/cover', authenticateToken, upload.single('cover'), userController.uploadCoverPhoto);
router.get('/search', userController.searchUsers);
router.get('/suggestions', authenticateToken, userController.getSuggestedConnections);

module.exports = router;
