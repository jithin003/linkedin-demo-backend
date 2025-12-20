const db = require('../config/database');

// Get user profile
exports.getProfile = async (req, res) => {
    try {
        const userId = req.params.id || (req.user ? req.user.id : null);

        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID required' });
        }

        // Get user basic info
        const [users] = await db.query(
            'SELECT id, name, email, profile_picture, cover_image, bio, headline, location, created_at FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const user = users[0];

        // Get skills (handle if table doesn't exist)
        let skills = [];
        try {
            const [skillsResult] = await db.query(
                'SELECT id, skill_name FROM skills WHERE user_id = ? ORDER BY created_at DESC',
                [userId]
            );
            skills = skillsResult;
        } catch (error) {
            console.log('Skills table not found or error:', error.message);
        }

        // Get experience (handle if table doesn't exist)
        let experience = [];
        try {
            const [expResult] = await db.query(
                'SELECT * FROM experience WHERE user_id = ? ORDER BY is_current DESC, start_date DESC',
                [userId]
            );
            experience = expResult;
        } catch (error) {
            console.log('Experience table not found or error:', error.message);
        }

        // Get education (handle if table doesn't exist)
        let education = [];
        try {
            const [eduResult] = await db.query(
                'SELECT * FROM education WHERE user_id = ? ORDER BY end_year DESC',
                [userId]
            );
            education = eduResult;
        } catch (error) {
            console.log('Education table not found or error:', error.message);
        }

        res.json({
            success: true,
            data: {
                ...user,
                skills: skills.map(s => ({ id: s.id, name: s.skill_name })),
                experience,
                education
            }
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Update profile
exports.updateProfile = async (req, res) => {
    try {
        const { bio, headline, location } = req.body;
        const userId = req.user.id;

        await db.query(
            'UPDATE users SET bio = ?, headline = ?, location = ? WHERE id = ?',
            [bio, headline, location, userId]
        );

        res.json({ success: true, message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Upload profile picture
exports.uploadProfilePicture = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const userId = req.user.id;
        const profilePicture = `/uploads/profiles/${req.file.filename}`;

        await db.query(
            'UPDATE users SET profile_picture = ? WHERE id = ?',
            [profilePicture, userId]
        );

        res.json({
            success: true,
            data: { profile_picture: profilePicture }
        });
    } catch (error) {
        console.error('Upload profile picture error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Upload cover image
exports.uploadCoverImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const userId = req.user.id;
        const coverImage = `/uploads/covers/${req.file.filename}`;

        await db.query(
            'UPDATE users SET cover_image = ? WHERE id = ?',
            [coverImage, userId]
        );

        res.json({
            success: true,
            data: { cover_image: coverImage }
        });
    } catch (error) {
        console.error('Upload cover image error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Add skill
exports.addSkill = async (req, res) => {
    try {
        const { skill_name } = req.body;
        const userId = req.user.id;

        const [result] = await db.query(
            'INSERT INTO skills (user_id, skill_name) VALUES (?, ?)',
            [userId, skill_name]
        );

        res.json({
            success: true,
            data: { id: result.insertId, name: skill_name }
        });
    } catch (error) {
        console.error('Add skill error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Remove skill
exports.removeSkill = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        await db.query(
            'DELETE FROM skills WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        res.json({ success: true, message: 'Skill removed' });
    } catch (error) {
        console.error('Remove skill error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Add experience
exports.addExperience = async (req, res) => {
    try {
        const { title, company, location, start_date, end_date, is_current, description } = req.body;
        const userId = req.user.id;

        const [result] = await db.query(
            'INSERT INTO experience (user_id, title, company, location, start_date, end_date, is_current, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [userId, title, company, location, start_date, end_date || null, is_current || false, description]
        );

        res.json({
            success: true,
            data: {
                id: result.insertId,
                title,
                company,
                location,
                start_date,
                end_date,
                is_current,
                description
            }
        });
    } catch (error) {
        console.error('Add experience error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Update experience
exports.updateExperience = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, company, location, start_date, end_date, is_current, description } = req.body;
        const userId = req.user.id;

        await db.query(
            'UPDATE experience SET title = ?, company = ?, location = ?, start_date = ?, end_date = ?, is_current = ?, description = ? WHERE id = ? AND user_id = ?',
            [title, company, location, start_date, end_date || null, is_current || false, description, id, userId]
        );

        res.json({ success: true, message: 'Experience updated' });
    } catch (error) {
        console.error('Update experience error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Delete experience
exports.deleteExperience = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        await db.query(
            'DELETE FROM experience WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        res.json({ success: true, message: 'Experience deleted' });
    } catch (error) {
        console.error('Delete experience error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Add education
exports.addEducation = async (req, res) => {
    try {
        const { school, degree, field_of_study, start_year, end_year, description } = req.body;
        const userId = req.user.id;

        const [result] = await db.query(
            'INSERT INTO education (user_id, school, degree, field_of_study, start_year, end_year, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [userId, school, degree, field_of_study, start_year, end_year || null, description]
        );

        res.json({
            success: true,
            data: {
                id: result.insertId,
                school,
                degree,
                field_of_study,
                start_year,
                end_year,
                description
            }
        });
    } catch (error) {
        console.error('Add education error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Update education
exports.updateEducation = async (req, res) => {
    try {
        const { id } = req.params;
        const { school, degree, field_of_study, start_year, end_year, description } = req.body;
        const userId = req.user.id;

        await db.query(
            'UPDATE education SET school = ?, degree = ?, field_of_study = ?, start_year = ?, end_year = ?, description = ? WHERE id = ? AND user_id = ?',
            [school, degree, field_of_study, start_year, end_year || null, description, id, userId]
        );

        res.json({ success: true, message: 'Education updated' });
    } catch (error) {
        console.error('Update education error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Delete education
exports.deleteEducation = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        await db.query(
            'DELETE FROM education WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        res.json({ success: true, message: 'Education deleted' });
    } catch (error) {
        console.error('Delete education error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
