const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const fcmController = require('../controllers/fcm.controller');
const { authenticateToken } = require('../middleware/auth');

// Notification routes
router.get('/', authenticateToken, notificationController.getNotifications);
router.put('/:id/read', authenticateToken, notificationController.markAsRead);
router.put('/read-all', authenticateToken, notificationController.markAllAsRead);
router.get('/unread-count', authenticateToken, notificationController.getUnreadCount);
router.delete('/:id', authenticateToken, notificationController.deleteNotification);

// FCM token routes
router.post('/register-token', authenticateToken, fcmController.registerToken);
router.post('/unregister-token', authenticateToken, fcmController.unregisterToken);

module.exports = router;
