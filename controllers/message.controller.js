const db = require('../config/database');

// Send a message
exports.sendMessage = async (req, res) => {
    try {
        const senderId = req.user.userId;
        const { receiverId, content } = req.body;

        if (!content || !receiverId) {
            return res.status(400).json({
                success: false,
                message: 'Receiver ID and content required'
            });
        }

        // Insert message
        const [result] = await db.query(
            'INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)',
            [senderId, receiverId, content]
        );

        // Get the created message
        const [messages] = await db.query(
            `SELECT m.*, u.first_name, u.last_name, u.profile_photo
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.id = ?`,
            [result.insertId]
        );

        // Create notification
        await db.query(
            `INSERT INTO notifications (user_id, type, content, related_user_id) 
       VALUES (?, 'message', 'sent you a message', ?)`,
            [receiverId, senderId]
        );

        res.status(201).json({
            success: true,
            message: 'Message sent',
            data: messages[0]
        });

    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Get conversation with a user
exports.getConversation = async (req, res) => {
    try {
        const userId = req.user.userId;
        const otherUserId = req.params.userId;
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;

        const [messages] = await db.query(
            `SELECT m.*, 
              sender.first_name as sender_first_name, 
              sender.last_name as sender_last_name,
              sender.profile_photo as sender_profile_photo
       FROM messages m
       JOIN users sender ON m.sender_id = sender.id
       WHERE (m.sender_id = ? AND m.receiver_id = ?) 
          OR (m.sender_id = ? AND m.receiver_id = ?)
       ORDER BY m.created_at DESC
       LIMIT ? OFFSET ?`,
            [userId, otherUserId, otherUserId, userId, limit, offset]
        );

        // Mark messages as read
        await db.query(
            'UPDATE messages SET is_read = TRUE WHERE sender_id = ? AND receiver_id = ? AND is_read = FALSE',
            [otherUserId, userId]
        );

        res.json({
            success: true,
            data: messages.reverse() // Return in chronological order
        });

    } catch (error) {
        console.error('Get conversation error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Get all conversations
exports.getConversations = async (req, res) => {
    try {
        const userId = req.user.userId;

        // Get list of users with whom the current user has conversations
        const [conversations] = await db.query(
            `SELECT DISTINCT
         CASE 
           WHEN m.sender_id = ? THEN m.receiver_id 
           ELSE m.sender_id 
         END as user_id,
         u.first_name,
         u.last_name,
         u.profile_photo,
         u.headline,
         (SELECT content FROM messages 
          WHERE (sender_id = ? AND receiver_id = user_id) 
             OR (sender_id = user_id AND receiver_id = ?)
          ORDER BY created_at DESC LIMIT 1) as last_message,
         (SELECT created_at FROM messages 
          WHERE (sender_id = ? AND receiver_id = user_id) 
             OR (sender_id = user_id AND receiver_id = ?)
          ORDER BY created_at DESC LIMIT 1) as last_message_time,
         (SELECT COUNT(*) FROM messages 
          WHERE sender_id = user_id AND receiver_id = ? AND is_read = FALSE) as unread_count
       FROM messages m
       JOIN users u ON (
         CASE 
           WHEN m.sender_id = ? THEN m.receiver_id 
           ELSE m.sender_id 
         END = u.id
       )
       WHERE m.sender_id = ? OR m.receiver_id = ?
       ORDER BY last_message_time DESC`,
            [userId, userId, userId, userId, userId, userId, userId, userId, userId]
        );

        res.json({
            success: true,
            data: conversations
        });

    } catch (error) {
        console.error('Get conversations error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Mark messages as read
exports.markAsRead = async (req, res) => {
    try {
        const userId = req.user.userId;
        const senderId = req.params.userId;

        await db.query(
            'UPDATE messages SET is_read = TRUE WHERE sender_id = ? AND receiver_id = ?',
            [senderId, userId]
        );

        res.json({
            success: true,
            message: 'Messages marked as read'
        });

    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Get unread message count
exports.getUnreadCount = async (req, res) => {
    try {
        const userId = req.user.userId;

        const [result] = await db.query(
            'SELECT COUNT(*) as count FROM messages WHERE receiver_id = ? AND is_read = FALSE',
            [userId]
        );

        res.json({
            success: true,
            data: {
                unreadCount: result[0].count
            }
        });

    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};
