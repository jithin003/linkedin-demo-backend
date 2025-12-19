const db = require('../config/database');

// Create a new post
exports.createPost = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { content } = req.body;

        if (!content && (!req.files || req.files.length === 0)) {
            return res.status(400).json({
                success: false,
                message: 'Post must have content or media'
            });
        }

        // Insert post
        const [result] = await db.query(
            'INSERT INTO posts (user_id, content) VALUES (?, ?)',
            [userId, content || '']
        );

        const postId = result.insertId;

        // Insert media if any
        if (req.files && req.files.length > 0) {
            const mediaValues = req.files.map(file => {
                const mediaType = file.mimetype.startsWith('image/') ? 'image' : 'video';
                const mediaUrl = `/uploads/posts/${file.filename}`;
                return [postId, mediaType, mediaUrl];
            });

            await db.query(
                'INSERT INTO post_media (post_id, media_type, media_url) VALUES ?',
                [mediaValues]
            );
        }

        // Get the created post with user info
        const [posts] = await db.query(
            `SELECT p.*, u.first_name, u.last_name, u.headline, u.profile_photo,
              (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
              (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.id = ?`,
            [postId]
        );

        // Get media
        const [media] = await db.query(
            'SELECT media_type, media_url FROM post_media WHERE post_id = ?',
            [postId]
        );

        const post = posts[0];
        post.media = media;
        post.is_liked = false;

        res.status(201).json({
            success: true,
            message: 'Post created successfully',
            data: post
        });

    } catch (error) {
        console.error('Create post error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Get feed posts
exports.getFeed = async (req, res) => {
    try {
        const userId = req.user.userId;
        const limit = parseInt(req.query.limit) || 20;
        const offset = parseInt(req.query.offset) || 0;

        // Get posts from connections and own posts
        const [posts] = await db.query(
            `SELECT p.*, u.first_name, u.last_name, u.headline, u.profile_photo,
              (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
              (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count,
              EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = ?) as is_liked
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.user_id = ? 
          OR p.user_id IN (
            SELECT CASE 
              WHEN requester_id = ? THEN receiver_id 
              ELSE requester_id 
            END
            FROM connections 
            WHERE (requester_id = ? OR receiver_id = ?) AND status = 'accepted'
          )
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
            [userId, userId, userId, userId, userId, limit, offset]
        );

        // Get media for each post
        for (let post of posts) {
            const [media] = await db.query(
                'SELECT media_type, media_url FROM post_media WHERE post_id = ?',
                [post.id]
            );
            post.media = media;
            post.is_liked = Boolean(post.is_liked);
        }

        res.json({
            success: true,
            data: posts
        });

    } catch (error) {
        console.error('Get feed error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Get user posts
exports.getUserPosts = async (req, res) => {
    try {
        const targetUserId = req.params.userId;
        const currentUserId = req.user ? req.user.userId : null;
        const limit = parseInt(req.query.limit) || 20;
        const offset = parseInt(req.query.offset) || 0;

        const [posts] = await db.query(
            `SELECT p.*, u.first_name, u.last_name, u.headline, u.profile_photo,
              (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
              (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count,
              ${currentUserId ? `EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = ${currentUserId}) as is_liked` : '0 as is_liked'}
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.user_id = ?
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
            [targetUserId, limit, offset]
        );

        // Get media for each post
        for (let post of posts) {
            const [media] = await db.query(
                'SELECT media_type, media_url FROM post_media WHERE post_id = ?',
                [post.id]
            );
            post.media = media;
            post.is_liked = Boolean(post.is_liked);
        }

        res.json({
            success: true,
            data: posts
        });

    } catch (error) {
        console.error('Get user posts error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Like a post
exports.likePost = async (req, res) => {
    try {
        const userId = req.user.userId;
        const postId = req.params.id;

        // Check if already liked
        const [existing] = await db.query(
            'SELECT id FROM likes WHERE user_id = ? AND post_id = ?',
            [userId, postId]
        );

        if (existing.length > 0) {
            // Unlike
            await db.query(
                'DELETE FROM likes WHERE user_id = ? AND post_id = ?',
                [userId, postId]
            );

            return res.json({
                success: true,
                message: 'Post unliked',
                data: { is_liked: false }
            });
        }

        // Like
        await db.query(
            'INSERT INTO likes (user_id, post_id) VALUES (?, ?)',
            [userId, postId]
        );

        // Create notification for post owner
        const [posts] = await db.query('SELECT user_id FROM posts WHERE id = ?', [postId]);
        if (posts.length > 0 && posts[0].user_id !== userId) {
            await db.query(
                `INSERT INTO notifications (user_id, type, content, related_user_id, related_post_id) 
         VALUES (?, 'like', 'liked your post', ?, ?)`,
                [posts[0].user_id, userId, postId]
            );
        }

        res.json({
            success: true,
            message: 'Post liked',
            data: { is_liked: true }
        });

    } catch (error) {
        console.error('Like post error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Comment on a post
exports.commentOnPost = async (req, res) => {
    try {
        const userId = req.user.userId;
        const postId = req.params.id;
        const { content } = req.body;

        if (!content) {
            return res.status(400).json({
                success: false,
                message: 'Comment content required'
            });
        }

        const [result] = await db.query(
            'INSERT INTO comments (user_id, post_id, content) VALUES (?, ?, ?)',
            [userId, postId, content]
        );

        // Get the comment with user info
        const [comments] = await db.query(
            `SELECT c.*, u.first_name, u.last_name, u.profile_photo
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`,
            [result.insertId]
        );

        // Create notification for post owner
        const [posts] = await db.query('SELECT user_id FROM posts WHERE id = ?', [postId]);
        if (posts.length > 0 && posts[0].user_id !== userId) {
            await db.query(
                `INSERT INTO notifications (user_id, type, content, related_user_id, related_post_id) 
         VALUES (?, 'comment', 'commented on your post', ?, ?)`,
                [posts[0].user_id, userId, postId]
            );
        }

        res.status(201).json({
            success: true,
            message: 'Comment added',
            data: comments[0]
        });

    } catch (error) {
        console.error('Comment on post error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Get post comments
exports.getPostComments = async (req, res) => {
    try {
        const postId = req.params.id;
        const limit = parseInt(req.query.limit) || 20;
        const offset = parseInt(req.query.offset) || 0;

        const [comments] = await db.query(
            `SELECT c.*, u.first_name, u.last_name, u.profile_photo, u.headline
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.post_id = ?
       ORDER BY c.created_at DESC
       LIMIT ? OFFSET ?`,
            [postId, limit, offset]
        );

        res.json({
            success: true,
            data: comments
        });

    } catch (error) {
        console.error('Get post comments error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Delete a post
exports.deletePost = async (req, res) => {
    try {
        const userId = req.user.userId;
        const postId = req.params.id;

        // Check if post belongs to user
        const [posts] = await db.query(
            'SELECT user_id FROM posts WHERE id = ?',
            [postId]
        );

        if (posts.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }

        if (posts[0].user_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this post'
            });
        }

        await db.query('DELETE FROM posts WHERE id = ?', [postId]);

        res.json({
            success: true,
            message: 'Post deleted successfully'
        });

    } catch (error) {
        console.error('Delete post error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};
