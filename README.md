# LinkedIn Backend API

Node.js backend for LinkedIn replica application with MySQL database.

## Features

- 🔐 JWT Authentication
- 👤 User Profiles
- 📝 Posts with Media (Images/Videos)
- 💬 Real-time Messaging
- 🤝 Connections/Networking
- 💼 Job Postings
- 🔔 Notifications
- 🔍 Search Functionality

## Prerequisites

- Node.js 14+ 
- MySQL 8+
- npm or yarn

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and update with your settings:

```bash
cp .env.example .env
```

Edit `.env`:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=linkedin_db
JWT_SECRET=your_secret_key_here
PORT=3000
```

### 3. Initialize Database

Make sure MySQL is running, then:

```bash
npm run init-db
```

This will create the database and all required tables.

### 4. Start Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

Server will start on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh token

### Users
- `GET /api/users/profile/:id` - Get user profile
- `PUT /api/users/profile` - Update profile
- `POST /api/users/profile/photo` - Upload profile photo
- `POST /api/users/profile/cover` - Upload cover photo
- `GET /api/users/search` - Search users
- `GET /api/users/suggestions` - Get connection suggestions

### Posts
- `POST /api/posts` - Create post
- `GET /api/posts/feed` - Get feed
- `GET /api/posts/user/:userId` - Get user posts
- `POST /api/posts/:id/like` - Like/unlike post
- `POST /api/posts/:id/comment` - Comment on post
- `GET /api/posts/:id/comments` - Get post comments
- `DELETE /api/posts/:id` - Delete post

### Connections
- `POST /api/connections/request` - Send connection request
- `PUT /api/connections/:id/accept` - Accept connection
- `PUT /api/connections/:id/reject` - Reject connection
- `GET /api/connections` - Get connections
- `GET /api/connections/pending` - Get pending requests
- `DELETE /api/connections/:userId` - Remove connection

### Messages
- `POST /api/messages` - Send message
- `GET /api/messages/conversation/:userId` - Get conversation
- `GET /api/messages/conversations` - Get all conversations
- `PUT /api/messages/read/:userId` - Mark messages as read
- `GET /api/messages/unread-count` - Get unread count

### Jobs
- `POST /api/jobs` - Create job posting
- `GET /api/jobs` - Get job listings
- `GET /api/jobs/:id` - Get single job
- `POST /api/jobs/:id/apply` - Apply to job
- `GET /api/jobs/my-applications` - Get my applications
- `DELETE /api/jobs/:id` - Delete job

### Notifications
- `GET /api/notifications` - Get notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read
- `GET /api/notifications/unread-count` - Get unread count
- `DELETE /api/notifications/:id` - Delete notification

## Database Schema

The database includes the following tables:
- `users` - User accounts and profiles
- `posts` - User posts
- `post_media` - Images/videos attached to posts
- `likes` - Post likes
- `comments` - Post comments
- `connections` - User connections
- `messages` - Direct messages
- `notifications` - User notifications
- `jobs` - Job postings
- `job_applications` - Job applications
- `experience` - User work experience
- `education` - User education
- `skills` - User skills

## File Upload

Uploaded files are stored in:
- `uploads/profiles/` - Profile photos
- `uploads/covers/` - Cover photos
- `uploads/posts/` - Post media

Max file size: 10MB

## Authentication

Protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Development

The API uses:
- Express.js - Web framework
- MySQL2 - Database driver
- bcryptjs - Password hashing
- jsonwebtoken - JWT tokens
- Multer - File uploads
- express-validator - Input validation

## License

MIT
