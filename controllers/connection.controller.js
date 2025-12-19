const db = require('../config/database');

// Send connection request
exports.sendConnectionRequest = async (req, res) => {
    try {
        const requesterId = req.user.userId;
        const { receiverId } = req.body;

        if (requesterId === parseInt(receiverId)) {
            return res.status(400).json({
                success: false,
                message: 'Cannot connect with yourself'
            });
        }

        // Check if connection already exists
        const [existing] = await db.query(
            `SELECT * FROM connections 
       WHERE (requester_id = ? AND receiver_id = ?) 
          OR (requester_id = ? AND receiver_id = ?)`,
            [requesterId, receiverId, receiverId, requesterId]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Connection request already exists'
            });
        }

        // Create connection request
        await db.query(
            'INSERT INTO connections (requester_id, receiver_id, status) VALUES (?, ?, ?)',
            [requesterId, receiverId, 'pending']
        );

        // Create notification
        await db.query(
            `INSERT INTO notifications (user_id, type, content, related_user_id) 
       VALUES (?, 'connection_request', 'sent you a connection request', ?)`,
            [receiverId, requesterId]
        );

        res.status(201).json({
            success: true,
            message: 'Connection request sent'
        });

    } catch (error) {
        console.error('Send connection request error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Accept connection request
exports.acceptConnection = async (req, res) => {
    try {
        const userId = req.user.userId;
        const connectionId = req.params.id;

        // Verify the connection request is for this user
        const [connections] = await db.query(
            'SELECT * FROM connections WHERE id = ? AND receiver_id = ? AND status = ?',
            [connectionId, userId, 'pending']
        );

        if (connections.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Connection request not found'
            });
        }

        const connection = connections[0];

        // Update status
        await db.query(
            'UPDATE connections SET status = ? WHERE id = ?',
            ['accepted', connectionId]
        );

        // Create notification for requester
        await db.query(
            `INSERT INTO notifications (user_id, type, content, related_user_id) 
       VALUES (?, 'connection_accepted', 'accepted your connection request', ?)`,
            [connection.requester_id, userId]
        );

        res.json({
            success: true,
            message: 'Connection accepted'
        });

    } catch (error) {
        console.error('Accept connection error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Reject connection request
exports.rejectConnection = async (req, res) => {
    try {
        const userId = req.user.userId;
        const connectionId = req.params.id;

        const [result] = await db.query(
            'UPDATE connections SET status = ? WHERE id = ? AND receiver_id = ? AND status = ?',
            ['rejected', connectionId, userId, 'pending']
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Connection request not found'
            });
        }

        res.json({
            success: true,
            message: 'Connection rejected'
        });

    } catch (error) {
        console.error('Reject connection error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Get user connections
exports.getConnections = async (req, res) => {
    try {
        const userId = req.user.userId;

        const [connections] = await db.query(
            `SELECT u.id, u.first_name, u.last_name, u.headline, u.profile_photo, u.location
       FROM connections c
       JOIN users u ON (
         CASE 
           WHEN c.requester_id = ? THEN c.receiver_id 
           ELSE c.requester_id 
         END = u.id
       )
       WHERE (c.requester_id = ? OR c.receiver_id = ?) AND c.status = 'accepted'
       ORDER BY u.first_name, u.last_name`,
            [userId, userId, userId]
        );

        res.json({
            success: true,
            data: connections
        });

    } catch (error) {
        console.error('Get connections error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Get pending connection requests
exports.getPendingRequests = async (req, res) => {
    try {
        const userId = req.user.userId;

        const [requests] = await db.query(
            `SELECT c.id as connection_id, u.id, u.first_name, u.last_name, 
              u.headline, u.profile_photo, u.location, c.created_at
       FROM connections c
       JOIN users u ON c.requester_id = u.id
       WHERE c.receiver_id = ? AND c.status = 'pending'
       ORDER BY c.created_at DESC`,
            [userId]
        );

        res.json({
            success: true,
            data: requests
        });

    } catch (error) {
        console.error('Get pending requests error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Remove connection
exports.removeConnection = async (req, res) => {
    try {
        const userId = req.user.userId;
        const connectionUserId = req.params.userId;

        const [result] = await db.query(
            `DELETE FROM connections 
       WHERE ((requester_id = ? AND receiver_id = ?) 
          OR (requester_id = ? AND receiver_id = ?)) 
       AND status = 'accepted'`,
            [userId, connectionUserId, connectionUserId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Connection not found'
            });
        }

        res.json({
            success: true,
            message: 'Connection removed'
        });

    } catch (error) {
        console.error('Remove connection error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};
