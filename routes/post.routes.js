const express = require('express');
const router = express.Router();
const postController = require('../controllers/post.controller');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

// Routes
router.post('/', authenticateToken, upload.array('media', 5), postController.createPost);
router.get('/feed', authenticateToken, postController.getFeed);
router.get('/user/:userId', optionalAuth, postController.getUserPosts);
router.post('/:id/like', authenticateToken, postController.likePost);
router.post('/:id/comment', authenticateToken, postController.commentOnPost);
router.get('/:id/comments', postController.getPostComments);
router.delete('/:id', authenticateToken, postController.deletePost);

module.exports = router;
