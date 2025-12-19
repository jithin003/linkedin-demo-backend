const db = require('../config/database');
const bcrypt = require('bcryptjs');

// Get user profile by ID
exports.getProfile = async (req, res) => {
    try {
        const userId = req.params.id;

        // Get user basic info
        const [users] = await db.query(
            `SELECT id, email, first_name, last_name, headline, profile_photo, 
              cover_photo, about, location, industry, website, created_at 
       FROM users WHERE id = ?`,
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const user = users[0];

        // Get connection count
        const [connections] = await db.query(
            `SELECT COUNT(*) as count FROM connections 
       WHERE (requester_id = ? OR receiver_id = ?) AND status = 'accepted'`,
            [userId, userId]
        );

        user.connectionsCount = connections[0].count;

        // Get experience
        const [experience] = await db.query(
            `SELECT * FROM experience WHERE user_id = ? ORDER BY start_date DESC`,
            [userId]
        );

        user.experience = experience;

        // Get education
        const [education] = await db.query(
            `SELECT * FROM education WHERE user_id = ? ORDER BY start_date DESC`,
            [userId]
        );

        user.education = education;

        // Get skills
        const [skills] = await db.query(
            `SELECT skill_name FROM skills WHERE user_id = ?`,
            [userId]
        );

        user.skills = skills.map(s => s.skill_name);

        // Check connection status with current user
        if (req.user && req.user.userId !== parseInt(userId)) {
            const [connectionStatus] = await db.query(
                `SELECT status FROM connections 
         WHERE (requester_id = ? AND receiver_id = ?) 
            OR (requester_id = ? AND receiver_id = ?)`,
                [req.user.userId, userId, userId, req.user.userId]
            );

            user.connectionStatus = connectionStatus.length > 0 ? connectionStatus[0].status : 'none';
        }

        res.json({
            success: true,
            data: user
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Update user profile
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        const {
            firstName,
            lastName,
            headline,
            about,
            location,
            industry,
            website
        } = req.body;

        const updates = [];
        const values = [];

        if (firstName !== undefined) {
            updates.push('first_name = ?');
            values.push(firstName);
        }
        if (lastName !== undefined) {
            updates.push('last_name = ?');
            values.push(lastName);
        }
        if (headline !== undefined) {
            updates.push('headline = ?');
            values.push(headline);
        }
        if (about !== undefined) {
            updates.push('about = ?');
            values.push(about);
        }
        if (location !== undefined) {
            updates.push('location = ?');
            values.push(location);
        }
        if (industry !== undefined) {
            updates.push('industry = ?');
            values.push(industry);
        }
        if (website !== undefined) {
            updates.push('website = ?');
            values.push(website);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        values.push(userId);

        await db.query(
            `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        // Get updated user
        const [users] = await db.query(
            `SELECT id, email, first_name, last_name, headline, profile_photo, 
              cover_photo, about, location, industry, website 
       FROM users WHERE id = ?`,
            [userId]
        );

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: users[0]
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Upload profile photo
exports.uploadProfilePhoto = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const userId = req.user.userId;
        const photoUrl = `/uploads/profiles/${req.file.filename}`;

        await db.query(
            'UPDATE users SET profile_photo = ? WHERE id = ?',
            [photoUrl, userId]
        );

        res.json({
            success: true,
            message: 'Profile photo uploaded successfully',
            data: {
                photoUrl
            }
        });

    } catch (error) {
        console.error('Upload profile photo error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Upload cover photo
exports.uploadCoverPhoto = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const userId = req.user.userId;
        const photoUrl = `/uploads/covers/${req.file.filename}`;

        await db.query(
            'UPDATE users SET cover_photo = ? WHERE id = ?',
            [photoUrl, userId]
        );

        res.json({
            success: true,
            message: 'Cover photo uploaded successfully',
            data: {
                photoUrl
            }
        });

    } catch (error) {
        console.error('Upload cover photo error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Search users
exports.searchUsers = async (req, res) => {
    try {
        const { query, limit = 20, offset = 0 } = req.query;

        if (!query) {
            return res.status(400).json({
                success: false,
                message: 'Search query required'
            });
        }

        const searchPattern = `%${query}%`;

        const [users] = await db.query(
            `SELECT id, first_name, last_name, headline, profile_photo, location 
       FROM users 
       WHERE first_name LIKE ? OR last_name LIKE ? OR headline LIKE ?
       LIMIT ? OFFSET ?`,
            [searchPattern, searchPattern, searchPattern, parseInt(limit), parseInt(offset)]
        );

        res.json({
            success: true,
            data: users
        });

    } catch (error) {
        console.error('Search users error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Get suggested connections
exports.getSuggestedConnections = async (req, res) => {
    try {
        const userId = req.user.userId;
        const limit = parseInt(req.query.limit) || 10;

        // Get users who are not connected and not the current user
        const [users] = await db.query(
            `SELECT u.id, u.first_name, u.last_name, u.headline, u.profile_photo, u.location
       FROM users u
       WHERE u.id != ? 
       AND u.id NOT IN (
         SELECT CASE 
           WHEN requester_id = ? THEN receiver_id 
           ELSE requester_id 
         END
         FROM connections 
         WHERE (requester_id = ? OR receiver_id = ?)
       )
       ORDER BY RAND()
       LIMIT ?`,
            [userId, userId, userId, userId, limit]
        );

        res.json({
            success: true,
            data: users
        });

    } catch (error) {
        console.error('Get suggested connections error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};
