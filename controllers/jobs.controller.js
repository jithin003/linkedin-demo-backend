const jobsService = require('../services/jobs.service');
const db = require('../config/database');

// Get jobs
exports.getJobs = async (req, res) => {
    try {
        const { page = 1 } = req.query;
        const jobs = await jobsService.getJobs(page);

        res.json({
            success: true,
            data: jobs
        });
    } catch (error) {
        console.error('Get jobs error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch jobs'
        });
    }
};

// Search jobs
exports.searchJobs = async (req, res) => {
    try {
        const { q } = req.query;
        const jobs = await jobsService.searchJobs(q);

        res.json({
            success: true,
            data: jobs
        });
    } catch (error) {
        console.error('Search jobs error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to search jobs'
        });
    }
};

// Save job
exports.saveJob = async (req, res) => {
    try {
        const { job_id, job_data } = req.body;
        const userId = req.user.id;

        await db.query(
            'INSERT INTO saved_jobs (user_id, job_id, job_data) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE job_data = ?',
            [userId, job_id, JSON.stringify(job_data), JSON.stringify(job_data)]
        );

        res.json({
            success: true,
            message: 'Job saved successfully'
        });
    } catch (error) {
        console.error('Save job error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save job'
        });
    }
};

// Get saved jobs
exports.getSavedJobs = async (req, res) => {
    try {
        const userId = req.user.id;

        const [jobs] = await db.query(
            'SELECT job_id, job_data, created_at FROM saved_jobs WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );

        res.json({
            success: true,
            data: jobs.map(j => ({
                ...JSON.parse(j.job_data),
                savedAt: j.created_at
            }))
        });
    } catch (error) {
        console.error('Get saved jobs error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get saved jobs'
        });
    }
};

// Unsave job
exports.unsaveJob = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        await db.query(
            'DELETE FROM saved_jobs WHERE user_id = ? AND job_id = ?',
            [userId, id]
        );

        res.json({
            success: true,
            message: 'Job unsaved successfully'
        });
    } catch (error) {
        console.error('Unsave job error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to unsave job'
        });
    }
};
