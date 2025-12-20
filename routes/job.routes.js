const express = require('express');
const router = express.Router();
const jobsController = require('../controllers/jobs.controller');
const { authenticate } = require('../middleware/auth');

// Get jobs (public)
router.get('/', jobsController.getJobs);

// Search jobs (public)
router.get('/search', jobsController.searchJobs);

// Save job (authenticated)
router.post('/save', authenticate, jobsController.saveJob);

// Get saved jobs (authenticated)
router.get('/saved', authenticate, jobsController.getSavedJobs);

// Unsave job (authenticated)
router.delete('/saved/:id', authenticate, jobsController.unsaveJob);

module.exports = router;
