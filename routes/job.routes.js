const express = require('express');
const router = express.Router();
const jobsController = require('../controllers/jobs.controller');
const { authenticateToken } = require('../middleware/auth');

// Get jobs (public)
router.get('/', jobsController.getJobs);

// Search jobs (public)
router.get('/search', jobsController.searchJobs);

// Save job (authenticated)
router.post('/save', authenticateToken, jobsController.saveJob);

// Get saved jobs (authenticated)
router.get('/saved', authenticateToken, jobsController.getSavedJobs);

// Unsave job (authenticated)
router.delete('/saved/:id', authenticateToken, jobsController.unsaveJob);

module.exports = router;
