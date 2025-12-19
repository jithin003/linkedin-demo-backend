const express = require('express');
const router = express.Router();
const connectionController = require('../controllers/connection.controller');
const { authenticateToken } = require('../middleware/auth');

// Routes
router.post('/request', authenticateToken, connectionController.sendConnectionRequest);
router.put('/:id/accept', authenticateToken, connectionController.acceptConnection);
router.put('/:id/reject', authenticateToken, connectionController.rejectConnection);
router.get('/', authenticateToken, connectionController.getConnections);
router.get('/pending', authenticateToken, connectionController.getPendingRequests);
router.delete('/:userId', authenticateToken, connectionController.removeConnection);

module.exports = router;
