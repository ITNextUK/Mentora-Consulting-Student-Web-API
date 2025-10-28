# Mentora-Consulting-Student-Web-API

## Project Overview

This is a dedicated backend API for the **Mentora Consulting Student Web Core** application. It provides complete student profile management, authentication, CV processing, and university application services.

### Why a Separate API?

1. **Separation of Concerns**: Student-facing functionality isolated from admin/employee features
2. **Security**: Different authentication and authorization patterns for students
3. **Scalability**: Independent scaling and deployment from the main Mentora API
4. **Customization**: Tailored specifically for student portal requirements
5. **Shared Database**: Uses the same PostgreSQL database as Project-Mentora-API

## Key Features

### 🔐 Authentication & Authorization
- JWT-based authentication for students
- Secure password hashing with bcrypt
- Password reset with email tokens
- Token refresh mechanism
- Session management

### 👤 Student Profile Management
- Complete profile CRUD operations
- Profile completion tracking
- Personal information management
- Education history (multiple entries)
- Work experience tracking (multiple entries)
- Skills management
- Courses of interest (NEW)
- Location preferences - UK cities (NEW)
- Reference links (GitHub, LinkedIn, Portfolio)

### 📄 CV Processing
- CV upload (PDF, DOC, DOCX)
- AI-powered data extraction
- Automatic field population
- CV storage and management
- Support for multiple CV formats

### 🖼️ File Management
- Profile picture upload
- CV file storage
- Secure file handling
- File size validation
- MIME type validation

### 🔒 Security Features
- Helmet.js security headers
- Rate limiting (100 requests/15 min)
- CORS protection
- SQL injection prevention
- XSS protection
- Input validation & sanitization

### 📧 Email Notifications
- Welcome emails on registration
- Password reset emails
- Profile completion reminders
- Customizable email templates

## Technology Stack

### Core
- **Runtime**: Node.js 18+
- **Framework**: Express 5.x
- **Language**: JavaScript (ES6+)

### Database
- **Database**: PostgreSQL 14+
- **ORM**: Sequelize 6.37.7
- **Pattern**: Stored Procedures

### Authentication
- **JWT**: jsonwebtoken 9.0.2
- **Hashing**: bcryptjs 3.0.2

### File Processing
- **Upload**: Multer 2.0.2
- **PDF Parsing**: pdf-parse 2.2.2
- **Word Parsing**: mammoth 1.11.0
- **Resume Parsing**: resume-parser 1.1.0

### Security
- **Helmet**: 8.1.0
- **Rate Limiting**: express-rate-limit 8.1.0
- **CORS**: cors 2.8.5
- **Validation**: express-validator 7.2.1

### Utilities
- **Logging**: Winston 3.17.0
- **Email**: Nodemailer 7.0.6
- **Environment**: dotenv 16.4.7

## Project Structure

```
Mentora-Consulting-Student-Web-API/
│
├── config/                      # Configuration files
│   ├── database.js             # Database connection with retry logic
│   └── config.json             # Sequelize config
│
├── controllers/                 # Request handlers
│   ├── authController.js       # Authentication logic
│   └── studentController.js    # Student profile logic
│
├── middlewares/                 # Custom middleware
│   ├── auth.js                 # JWT authentication
│   ├── validation.js           # Input validation
│   ├── fileUpload.js           # File upload handling
│   └── errorHandler.js         # Error handling
│
├── migrations/                  # Database migrations
│   ├── 001_add_courses_locations_fields.sql
│   ├── runMigration.js
│   └── README.md
│
├── models/                      # Database models
│   ├── Student.js              # Student model with JSONB fields
│   └── index.js                # Model exports
│
├── routes/                      # API routes
│   ├── authRoutes.js           # Authentication endpoints
│   └── studentRoutes.js        # Student profile endpoints
│
├── services/                    # Business logic
│   └── cvExtractionService.js  # CV parsing service
│
├── utils/                       # Helper functions
│   ├── logger.js               # Winston logger
│   ├── responseHelper.js       # Response formatters
│   └── sendEmail.js            # Email utilities
│
├── uploads/                     # File uploads (gitignored)
│   ├── cv/
│   └── profilePictures/
│
├── logs/                        # Application logs (gitignored)
│
├── app.js                       # Express app setup
├── server.js                    # Server startup
├── package.json                 # Dependencies
├── .env.example                 # Environment template
├── .gitignore                   # Git ignore rules
├── README.md                    # Main documentation
├── SETUP.md                     # Setup guide
└── API_DOCUMENTATION.md         # API reference
```

## Database Schema

### Student Table (`mentora_ref.ref_mas_student`)

**Primary Key**: `student_id` (VARCHAR(20))

**Personal Information**:
- `first_name`, `last_name`, `email` (unique), `phone`, `nic`
- `date_of_birth`, `gender`, `address`, `city`, `country`

**Academic Information**:
- `degree`, `institution`, `graduation_year`, `gpa`
- `ielts_score`, `english_level`

**Professional Information**:
- `work_experience` (JSONB) - Array of work history
- `skills` (JSONB) - Array of skills

**Preferences** (NEW):
- `courses_of_interest` (JSONB) - Array of desired courses
- `location_interests` (JSONB) - Array of preferred UK cities

**References**:
- `github`, `linkedin`, `portfolio` (URLs)

**Files**:
- `cv_path` - CV file location
- `profile_picture_path` - Profile picture location

**Authentication**:
- `password_hash` - Bcrypt hashed password

**Metadata**:
- `status` (Active/Inactive/Pending/Suspended)
- `created_by`, `created_date`, `modified_by`, `modified_date`

### Stored Procedures

1. **sp_ref_student_insert**: Create new student record
2. **sp_ref_student_inquire**: Get student details
3. **sp_ref_student_modify**: Update student record
4. **sp_ref_student_delete**: Soft delete student

### Database Functions

1. **fn_get_next_student_id**: Generate next student ID
2. **fn_search_students**: Search students by term

## API Endpoints

### Base URL
```
http://localhost:5001/api/v1
```

### Authentication Endpoints
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Register new student | ❌ |
| POST | `/auth/login` | Login student | ❌ |
| POST | `/auth/refresh` | Refresh JWT token | ❌ |
| POST | `/auth/forgot-password` | Request password reset | ❌ |
| POST | `/auth/reset-password` | Reset password | ❌ |
| GET | `/auth/me` | Get current student | ✅ |

### Student Profile Endpoints
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/students/profile` | Get profile | ✅ |
| PUT | `/students/profile` | Update profile | ✅ |
| POST | `/students/cv/upload` | Upload CV | ✅ |
| POST | `/students/cv/extract` | Extract CV data | ✅ |
| DELETE | `/students/cv` | Delete CV | ✅ |
| POST | `/students/profile-picture` | Upload profile picture | ✅ |

## Installation & Setup

### Quick Start

1. **Install dependencies**:
```bash
cd Mentora-Consulting-Student-Web-API
npm install
```

2. **Configure environment**:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

3. **Run database migration**:
```bash
npm run migrate
```

4. **Start the server**:
```bash
# Development
npm run dev

# Production
npm start
```

5. **Verify**:
```bash
curl http://localhost:5001/health
```

### Detailed Setup

See [SETUP.md](SETUP.md) for detailed installation instructions.

## Configuration

### Environment Variables

Create a `.env` file with the following:

```env
# Server
NODE_ENV=development
PORT=5001
API_PREFIX=/api/v1

# Database (same as Project-Mentora-API)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mentora_consulting
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d

# CORS
CORS_ORIGIN=http://localhost:5173

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_password
EMAIL_FROM=noreply@mentoraconsulting.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

## Database Migration

The API includes a migration to add new fields to the student table:

```bash
# Run migration
npm run migrate

# Or use psql directly
psql -U postgres -d mentora_consulting -f migrations/001_add_courses_locations_fields.sql
```

**Added Fields**:
- `courses_of_interest` (JSONB): Stores course preferences
- `location_interests` (JSONB): Stores UK city preferences

## Testing

### Manual Testing with cURL

**Register**:
```bash
curl -X POST http://localhost:5001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"firstName":"John","lastName":"Doe","email":"john@example.com","password":"SecurePass123!","phone":"+441234567890"}'
```

**Login**:
```bash
curl -X POST http://localhost:5001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"SecurePass123!"}'
```

**Get Profile**:
```bash
curl -X GET http://localhost:5001/api/v1/students/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Upload CV**:
```bash
curl -X POST http://localhost:5001/api/v1/students/cv/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "cv=@/path/to/cv.pdf"
```

### Automated Testing

```bash
npm test
```

## Logging

Logs are managed by Winston:

- **Development**: Console output with colors
- **Production**: File-based logging in `logs/` directory
  - `error.log`: Error messages only
  - `combined.log`: All log levels

## Security Considerations

1. **Environment Variables**: Never commit `.env` file
2. **JWT Secret**: Use strong, random secret in production
3. **Database Credentials**: Use secure passwords
4. **HTTPS**: Enable SSL/TLS in production
5. **Rate Limiting**: Adjust based on your needs
6. **CORS**: Configure allowed origins properly
7. **File Upload**: Validate file types and sizes
8. **SQL Injection**: Using Sequelize ORM and parameterized queries
9. **XSS Protection**: Input validation and sanitization

## Deployment

### Development
```bash
npm run dev
```

### Production

1. Set `NODE_ENV=production` in `.env`
2. Use process manager (PM2):
```bash
npm install -g pm2
pm2 start server.js --name mentora-student-api
pm2 save
pm2 startup
```

3. Set up reverse proxy (Nginx/Apache)
4. Enable HTTPS with SSL certificates
5. Configure firewall rules
6. Set up monitoring and logging

## Integration with Frontend

Update the frontend API service to point to this backend:

```typescript
// src/services/api.ts
const API_BASE_URL = 'http://localhost:5001/api/v1';

// Example API call
const register = async (data) => {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return response.json();
};
```

## Differences from Project-Mentora-API

| Feature | Student API | Main API |
|---------|-------------|----------|
| **Target Users** | Students only | Employees & Admin |
| **Authentication** | Student JWT tokens | Employee JWT tokens |
| **Port** | 5001 | 5000 |
| **Scope** | Student profiles, CV, applications | Full admin & management |
| **Database** | Same (mentora_consulting) | Same (mentora_consulting) |
| **Schema** | mentora_ref (students) | mentora_ref + mentora_app |
| **New Fields** | coursesOfInterest, locationInterests | N/A |

## Troubleshooting

### Common Issues

**Port Already in Use**:
```bash
# Change PORT in .env
PORT=5002
```

**Database Connection Failed**:
- Check PostgreSQL is running
- Verify credentials in `.env`
- Ensure database exists

**Migration Failed**:
- Check database permissions
- See `migrations/README.md`

**File Upload Failed**:
- Ensure `uploads/` directories exist
- Check file permissions
- Verify file size limits

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## Support

For issues or questions:
- Email: support@mentoraconsulting.com
- Documentation: See `API_DOCUMENTATION.md`
- Setup Help: See `SETUP.md`

## License

ISC

## Changelog

### Version 1.0.0 (2025-10-28)
- Initial release
- Student registration and authentication
- Profile management with JSONB fields
- CV upload and AI-powered extraction
- Courses of interest feature
- Location interests feature (UK cities)
- Email notifications
- Security features (rate limiting, helmet, CORS)
- Winston logging
- Database migration system

## Roadmap

- [ ] Unit and integration tests
- [ ] API documentation with Swagger
- [ ] Real-time notifications (WebSocket)
- [ ] Advanced CV parsing with ML
- [ ] Multi-language support
- [ ] Document generation (offer letters, etc.)
- [ ] Analytics and reporting
- [ ] Third-party integrations (payment, etc.)

---

**Last Updated**: October 28, 2025  
**Version**: 1.0.0  
**Maintained by**: Mentora Consulting Development Team
