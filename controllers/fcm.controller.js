const db = require('../config/database');

// Register FCM token
exports.registerToken = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { fcmToken, deviceType } = req.body;

        if (!fcmToken) {
            return res.status(400).json({
                success: false,
                message: 'FCM token required'
            });
        }

        // Upsert token
        await db.query(
            `INSERT INTO user_tokens (user_id, fcm_token, device_type) 
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE fcm_token = ?, updated_at = CURRENT_TIMESTAMP`,
            [userId, fcmToken, deviceType || 'android', fcmToken]
        );

        res.json({
            success: true,
            message: 'FCM token registered successfully'
        });

    } catch (error) {
        console.error('Register token error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Unregister FCM token
exports.unregisterToken = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { deviceType } = req.body;

        await db.query(
            'DELETE FROM user_tokens WHERE user_id = ? AND device_type = ?',
            [userId, deviceType || 'android']
        );

        res.json({
            success: true,
            message: 'FCM token unregistered successfully'
        });

    } catch (error) {
        console.error('Unregister token error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};
