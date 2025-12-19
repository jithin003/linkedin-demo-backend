const express = require('express');
const router = express.Router();
const jobController = require('../controllers/job.controller');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

// Routes
router.post('/', authenticateToken, jobController.createJob);
router.get('/', optionalAuth, jobController.getJobs);
router.get('/my-applications', authenticateToken, jobController.getMyApplications);
router.get('/:id', optionalAuth, jobController.getJob);
router.post('/:id/apply', authenticateToken, jobController.applyToJob);
router.delete('/:id', authenticateToken, jobController.deleteJob);

module.exports = router;
