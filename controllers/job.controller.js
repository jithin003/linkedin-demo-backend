const db = require('../config/database');

// Create a job posting
exports.createJob = async (req, res) => {
    try {
        const userId = req.user.userId;
        const {
            title,
            company,
            location,
            employmentType,
            workplaceType,
            description,
            requirements,
            salaryRange
        } = req.body;

        if (!title || !company || !employmentType || !workplaceType || !description) {
            return res.status(400).json({
                success: false,
                message: 'Required fields missing'
            });
        }

        const [result] = await db.query(
            `INSERT INTO jobs (user_id, title, company, location, employment_type, 
                         workplace_type, description, requirements, salary_range) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [userId, title, company, location, employmentType, workplaceType,
                description, requirements, salaryRange]
        );

        const [jobs] = await db.query(
            `SELECT j.*, u.first_name, u.last_name, u.profile_photo
       FROM jobs j
       JOIN users u ON j.user_id = u.id
       WHERE j.id = ?`,
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'Job posted successfully',
            data: jobs[0]
        });

    } catch (error) {
        console.error('Create job error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Get job listings
exports.getJobs = async (req, res) => {
    try {
        const {
            search,
            location,
            employmentType,
            workplaceType,
            limit = 20,
            offset = 0
        } = req.query;

        let query = `
      SELECT j.*, u.first_name, u.last_name, u.profile_photo,
             (SELECT COUNT(*) FROM job_applications WHERE job_id = j.id) as applications_count
      FROM jobs j
      JOIN users u ON j.user_id = u.id
      WHERE 1=1
    `;
        const params = [];

        if (search) {
            query += ' AND (j.title LIKE ? OR j.company LIKE ? OR j.description LIKE ?)';
            const searchPattern = `%${search}%`;
            params.push(searchPattern, searchPattern, searchPattern);
        }

        if (location) {
            query += ' AND j.location LIKE ?';
            params.push(`%${location}%`);
        }

        if (employmentType) {
            query += ' AND j.employment_type = ?';
            params.push(employmentType);
        }

        if (workplaceType) {
            query += ' AND j.workplace_type = ?';
            params.push(workplaceType);
        }

        query += ' ORDER BY j.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const [jobs] = await db.query(query, params);

        // Check if user has applied (if authenticated)
        if (req.user) {
            for (let job of jobs) {
                const [applications] = await db.query(
                    'SELECT id FROM job_applications WHERE job_id = ? AND user_id = ?',
                    [job.id, req.user.userId]
                );
                job.has_applied = applications.length > 0;
            }
        }

        res.json({
            success: true,
            data: jobs
        });

    } catch (error) {
        console.error('Get jobs error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Get single job
exports.getJob = async (req, res) => {
    try {
        const jobId = req.params.id;

        const [jobs] = await db.query(
            `SELECT j.*, u.first_name, u.last_name, u.profile_photo, u.headline,
              (SELECT COUNT(*) FROM job_applications WHERE job_id = j.id) as applications_count
       FROM jobs j
       JOIN users u ON j.user_id = u.id
       WHERE j.id = ?`,
            [jobId]
        );

        if (jobs.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }

        const job = jobs[0];

        // Check if user has applied
        if (req.user) {
            const [applications] = await db.query(
                'SELECT id FROM job_applications WHERE job_id = ? AND user_id = ?',
                [jobId, req.user.userId]
            );
            job.has_applied = applications.length > 0;
        }

        res.json({
            success: true,
            data: job
        });

    } catch (error) {
        console.error('Get job error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Apply to a job
exports.applyToJob = async (req, res) => {
    try {
        const userId = req.user.userId;
        const jobId = req.params.id;
        const { coverLetter } = req.body;

        // Check if already applied
        const [existing] = await db.query(
            'SELECT id FROM job_applications WHERE job_id = ? AND user_id = ?',
            [jobId, userId]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Already applied to this job'
            });
        }

        await db.query(
            'INSERT INTO job_applications (job_id, user_id, cover_letter) VALUES (?, ?, ?)',
            [jobId, userId, coverLetter]
        );

        res.status(201).json({
            success: true,
            message: 'Application submitted successfully'
        });

    } catch (error) {
        console.error('Apply to job error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Get user's job applications
exports.getMyApplications = async (req, res) => {
    try {
        const userId = req.user.userId;

        const [applications] = await db.query(
            `SELECT ja.*, j.title, j.company, j.location, j.employment_type, j.workplace_type
       FROM job_applications ja
       JOIN jobs j ON ja.job_id = j.id
       WHERE ja.user_id = ?
       ORDER BY ja.created_at DESC`,
            [userId]
        );

        res.json({
            success: true,
            data: applications
        });

    } catch (error) {
        console.error('Get my applications error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Delete job posting
exports.deleteJob = async (req, res) => {
    try {
        const userId = req.user.userId;
        const jobId = req.params.id;

        const [jobs] = await db.query(
            'SELECT user_id FROM jobs WHERE id = ?',
            [jobId]
        );

        if (jobs.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }

        if (jobs[0].user_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this job'
            });
        }

        await db.query('DELETE FROM jobs WHERE id = ?', [jobId]);

        res.json({
            success: true,
            message: 'Job deleted successfully'
        });

    } catch (error) {
        console.error('Delete job error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};
