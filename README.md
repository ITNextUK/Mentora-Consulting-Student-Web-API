# Mentora Consulting Student Web API

Backend API for the Mentora Consulting Student Web Application. This API provides student profile management, authentication, CV processing, and university application services.

## Features

- 🔐 JWT-based authentication for students
- 👤 Complete student profile management
- 📄 CV upload and AI-powered data extraction
- 🎓 Multiple education entries support
- 💼 Work experience tracking
- 🌍 Location interests (UK cities)
- 📚 Courses of interest management
- 🏫 University applications
- 📧 Email notifications
- 🔒 Secure file uploads with validation

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express 5.x
- **Database**: PostgreSQL with Sequelize ORM
- **Authentication**: JWT (JSON Web Tokens)
- **File Processing**: Multer, PDF-Parse, Mammoth
- **Security**: Helmet, Rate Limiting, CORS
- **Logging**: Winston

## Prerequisites

- Node.js >= 18.0.0
- PostgreSQL >= 14.0
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Mentora-Consulting-Student-Web-API
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Configure your `.env` file with database credentials and JWT secret.

5. Ensure the PostgreSQL database `mentora_consulting` exists with the required schemas:
   - `mentora_ref` (for student data)
   - `mentora_app` (for application data)

## Database Setup

The API uses the existing Mentora Consulting database with stored procedures:
- `sp_ref_student_insert` - Create new student
- `sp_ref_student_inquire` - Get student details
- `sp_ref_student_modify` - Update student
- `sp_ref_student_delete` - Soft delete student

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The API will start on `http://localhost:5001` (configurable via PORT in .env)

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Student registration
- `POST /api/v1/auth/login` - Student login
- `POST /api/v1/auth/refresh` - Refresh JWT token
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password

### Student Profile
- `GET /api/v1/students/profile` - Get current student profile
- `PUT /api/v1/students/profile` - Update student profile
- `POST /api/v1/students/profile/complete` - Complete profile setup
- `POST /api/v1/students/cv/upload` - Upload CV file
- `POST /api/v1/students/cv/extract` - Extract data from CV
- `DELETE /api/v1/students/cv` - Remove CV
- `POST /api/v1/students/profile-picture` - Upload profile picture

### Universities
- `GET /api/v1/universities` - Get all universities
- `GET /api/v1/universities/:id` - Get university details
- `GET /api/v1/universities/search` - Search universities

### Applications
- `POST /api/v1/applications` - Create new application
- `GET /api/v1/applications` - Get student's applications
- `GET /api/v1/applications/:id` - Get application details
- `PUT /api/v1/applications/:id` - Update application
- `DELETE /api/v1/applications/:id` - Cancel application

## Security Features

- JWT token authentication
- Password hashing with bcrypt
- Rate limiting (100 requests per 15 minutes)
- CORS protection
- Helmet security headers
- File upload validation
- SQL injection prevention via Sequelize ORM

## File Upload Limits

- CV Files: PDF, DOC, DOCX (Max 10MB)
- Profile Pictures: JPG, PNG (Max 5MB)

## Error Handling

The API uses standardized error responses:
```json
{
  "success": false,
  "message": "Error message here",
  "error": "Detailed error information (dev mode only)"
}
```

## Logging

Winston logger configuration:
- Development: Console output with colors
- Production: File-based logging in `logs/` directory

## Testing

```bash
npm test
```

## Environment Variables

See `.env.example` for all available configuration options.

## Database Schema

### Student Table (`mentora_ref.ref_mas_student`)
- Personal information (name, email, phone, DOB, gender)
- Address details (address, city, country)
- Education (degree, institution, graduation year, GPA, IELTS)
- Work experience (JSONB array)
- Skills (JSONB array)
- Courses of interest (JSONB array)
- Location interests (JSONB array)
- References (GitHub, LinkedIn, Portfolio)
- CV path and profile picture

## Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## License

ISC

## Support

For support, email support@mentoraconsulting.com
