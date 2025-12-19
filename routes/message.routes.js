const express = require('express');
const router = express.Router();
const messageController = require('../controllers/message.controller');
const { authenticateToken } = require('../middleware/auth');

// Routes
router.post('/', authenticateToken, messageController.sendMessage);
router.get('/conversation/:userId', authenticateToken, messageController.getConversation);
router.get('/conversations', authenticateToken, messageController.getConversations);
router.put('/read/:userId', authenticateToken, messageController.markAsRead);
router.get('/unread-count', authenticateToken, messageController.getUnreadCount);

module.exports = router;
