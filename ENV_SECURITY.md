# Security Note: .env.production

## ⚠️ IMPORTANT

The `.env.production` file contains sensitive credentials and should **NEVER** be committed to Git.

### What to do:

1. **Keep `.env.production` locally** - Use it as a template
2. **Add credentials in Render** - Copy values to Render's environment variables
3. **Never commit** - File is in `.gitignore`

### For Deployment:

When deploying to Render:
1. Go to your service → Environment tab
2. Add each variable from `.env.production` manually
3. Never push `.env.production` to GitHub

### Template Variables:

```env
NODE_ENV=production
PORT=10000
JWT_SECRET=<generate-random-string>
JWT_EXPIRES_IN=7d

# Aiven MySQL (get from Aiven console)
DB_HOST=mysql-xxxxx.aivencloud.com
DB_USER=avnadmin
DB_PASSWORD=<your-aiven-password>
DB_NAME=linkedin_db
DB_PORT=12691
DB_SSL=true

UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760

FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json

SOCKET_IO_CORS_ORIGIN=https://your-subdomain.com,https://api.your-subdomain.com
```

### Security Best Practices:

✅ Use `.env.example` for templates (no real values)
✅ Add `.env*` to `.gitignore` (except `.env.example`)
✅ Use environment variables in production
✅ Rotate credentials if accidentally exposed
❌ Never commit `.env` files with real credentials
