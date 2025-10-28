# Mentora Student Web API - Quick Setup Guide

## Prerequisites
- Node.js >= 18.0.0
- PostgreSQL >= 14.0
- Git

## Step-by-Step Setup

### 1. Install Dependencies
```bash
cd Mentora-Consulting-Student-Web-API
npm install
```

### 2. Configure Environment
```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your configuration
# Use your preferred editor (notepad, VS Code, etc.)
notepad .env
```

**Required Configuration:**
```env
NODE_ENV=development
PORT=5001

# Database - Use same as Project-Mentora-API
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mentora_consulting
DB_USER=postgres
DB_PASSWORD=your_actual_password

# JWT Secret - Generate a secure random string
JWT_SECRET=your_secure_jwt_secret_key_here
JWT_EXPIRE=7d

# Frontend URL
CORS_ORIGIN=http://localhost:5173
```

### 3. Run Database Migration

The migration adds two new fields to the student table:
- `courses_of_interest` (JSONB)
- `location_interests` (JSONB)

**Option A: Using Node.js script (Recommended)**
```bash
npm run migrate
```

**Option B: Using psql**
```bash
psql -U postgres -d mentora_consulting -f migrations/001_add_courses_locations_fields.sql
```

### 4. Create Upload Directories
```bash
# Windows PowerShell
New-Item -ItemType Directory -Path uploads/cv -Force
New-Item -ItemType Directory -Path uploads/profilePictures -Force

# Or Git Bash / Linux
mkdir -p uploads/cv
mkdir -p uploads/profilePictures
```

### 5. Start the Server

**Development mode (with auto-restart):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The API will start on `http://localhost:5001`

### 6. Test the API

**Health Check:**
```bash
curl http://localhost:5001/health
```

**Register a Student:**
```bash
curl -X POST http://localhost:5001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"firstName\":\"John\",\"lastName\":\"Doe\",\"email\":\"john@example.com\",\"password\":\"SecurePass123!\",\"phone\":\"+441234567890\"}"
```

## Available Scripts

```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm run migrate    # Run database migrations
npm test           # Run tests (when implemented)
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new student
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh token
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password
- `GET /api/v1/auth/me` - Get current student

### Student Profile
- `GET /api/v1/students/profile` - Get profile
- `PUT /api/v1/students/profile` - Update profile
- `POST /api/v1/students/cv/upload` - Upload CV
- `POST /api/v1/students/cv/extract` - Extract CV data
- `DELETE /api/v1/students/cv` - Delete CV
- `POST /api/v1/students/profile-picture` - Upload profile picture

## Project Structure

```
Mentora-Consulting-Student-Web-API/
├── config/              # Database and app configuration
├── controllers/         # Request handlers
├── middlewares/         # Custom middleware
├── migrations/          # Database migrations
├── models/             # Sequelize models
├── routes/             # API routes
├── services/           # Business logic (CV extraction, etc.)
├── utils/              # Helper functions
├── uploads/            # File uploads (gitignored)
├── app.js              # Express app setup
├── server.js           # Server startup
└── package.json        # Dependencies and scripts
```

## Troubleshooting

### Database Connection Failed
- Verify PostgreSQL is running
- Check database credentials in `.env`
- Ensure database `mentora_consulting` exists

### Port Already in Use
- Change `PORT` in `.env` file
- Or stop the other process using port 5001

### Migration Fails
- Ensure you have the correct database permissions
- Check if columns already exist
- See `migrations/README.md` for detailed troubleshooting

### File Upload Issues
- Ensure `uploads/` directories exist
- Check file permissions
- Verify file size limits in `.env`

## Next Steps

1. **Connect Frontend**: Update the frontend API service to point to `http://localhost:5001/api/v1`
2. **Configure Email**: Add SMTP credentials to `.env` for email features
3. **Add SSL**: For production, use HTTPS with proper SSL certificates
4. **Set up Monitoring**: Add logging and monitoring tools
5. **Deploy**: Deploy to your preferred hosting service

## Support

For issues or questions:
- Check the logs in `logs/` directory
- Review API documentation in README.md
- Contact: support@mentoraconsulting.com

## Security Notes

- Never commit `.env` file
- Use strong JWT secrets in production
- Enable HTTPS in production
- Set up rate limiting appropriately
- Regularly update dependencies
- Use environment-specific configurations
