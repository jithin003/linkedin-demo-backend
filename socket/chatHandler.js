const db = require('../config/database');
const { sendPushNotification } = require('../config/firebase');

// Store online users
const onlineUsers = new Map();

const setupChatHandlers = (io) => {
    io.on('connection', (socket) => {
        const userId = socket.userId;
        console.log(`✅ User ${userId} connected via Socket.IO`);

        // Add user to online users
        onlineUsers.set(userId, socket.id);

        // Broadcast online status
        io.emit('user_online', { userId });

        // Join user's personal room
        socket.join(`user_${userId}`);

        // Handle typing indicator
        socket.on('typing', async ({ receiverId }) => {
            const receiverSocketId = onlineUsers.get(receiverId);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('user_typing', { userId });
            }
        });

        // Handle stop typing
        socket.on('stop_typing', async ({ receiverId }) => {
            const receiverSocketId = onlineUsers.get(receiverId);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('user_stop_typing', { userId });
            }
        });

        // Handle sending message
        socket.on('send_message', async ({ receiverId, content }) => {
            try {
                // Save message to database
                const [result] = await db.query(
                    'INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)',
                    [userId, receiverId, content]
                );

                // Get the created message with sender info
                const [messages] = await db.query(
                    `SELECT m.*, u.first_name, u.last_name, u.profile_photo
           FROM messages m
           JOIN users u ON m.sender_id = u.id
           WHERE m.id = ?`,
                    [result.insertId]
                );

                const message = messages[0];

                // Send to receiver if online
                const receiverSocketId = onlineUsers.get(receiverId);
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit('new_message', message);
                } else {
                    // Send push notification if receiver is offline
                    try {
                        const [tokens] = await db.query(
                            'SELECT fcm_token FROM user_tokens WHERE user_id = ? AND fcm_token IS NOT NULL',
                            [receiverId]
                        );

                        if (tokens.length > 0) {
                            const senderName = `${message.first_name} ${message.last_name}`;
                            await sendPushNotification(tokens[0].fcm_token, {
                                title: senderName,
                                body: content,
                                data: {
                                    type: 'message',
                                    senderId: userId.toString(),
                                    conversationId: receiverId.toString(),
                                },
                            });
                        }
                    } catch (error) {
                        console.error('Error sending push notification:', error);
                    }
                }

                // Send confirmation to sender
                socket.emit('message_sent', message);

                // Create notification in database
                await db.query(
                    `INSERT INTO notifications (user_id, type, content, related_user_id) 
           VALUES (?, 'message', 'sent you a message', ?)`,
                    [receiverId, userId]
                );

            } catch (error) {
                console.error('Error sending message:', error);
                socket.emit('message_error', { error: 'Failed to send message' });
            }
        });

        // Handle message read
        socket.on('mark_read', async ({ senderId }) => {
            try {
                await db.query(
                    'UPDATE messages SET is_read = TRUE WHERE sender_id = ? AND receiver_id = ?',
                    [senderId, userId]
                );

                // Notify sender that messages were read
                const senderSocketId = onlineUsers.get(senderId);
                if (senderSocketId) {
                    io.to(senderSocketId).emit('messages_read', { userId });
                }
            } catch (error) {
                console.error('Error marking messages as read:', error);
            }
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            console.log(`❌ User ${userId} disconnected`);
            onlineUsers.delete(userId);

            // Broadcast offline status
            io.emit('user_offline', { userId });
        });
    });
};

const getOnlineUsers = () => {
    return Array.from(onlineUsers.keys());
};

module.exports = { setupChatHandlers, getOnlineUsers };
