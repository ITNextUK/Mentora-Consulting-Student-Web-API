# Mentora Student Web API - Endpoints Documentation

Base URL: `http://localhost:5001/api/v1`

## Authentication Endpoints

### 1. Register Student
**POST** `/auth/register`

Register a new student account.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "SecurePass123!",
  "phone": "+441234567890"
}
```

**Validation Rules:**
- `firstName`: 2-50 characters, required
- `lastName`: 2-50 characters, required
- `email`: Valid email format, required, unique
- `password`: Min 8 characters, must contain uppercase, lowercase, number, and special character
- `phone`: Valid phone number, optional

**Success Response (201):**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "student": {
      "studentId": "STD001",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "status": "Active",
      "createdDate": "2025-10-28T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 2. Login
**POST** `/auth/login`

Authenticate student and get JWT token.

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "SecurePass123!"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "student": { /* student object */ },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 3. Refresh Token
**POST** `/auth/refresh`

Get a new JWT token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 4. Forgot Password
**POST** `/auth/forgot-password`

Request password reset email.

**Request Body:**
```json
{
  "email": "john.doe@example.com"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "If the email exists, a reset link will be sent"
}
```

---

### 5. Reset Password
**POST** `/auth/reset-password`

Reset password using token from email.

**Request Body:**
```json
{
  "token": "reset_token_from_email",
  "password": "NewSecurePass123!"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password reset successful"
}
```

---

### 6. Get Current Student
**GET** `/auth/me`

Get currently authenticated student.

**Headers:**
```
Authorization: Bearer {token}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Student retrieved successfully",
  "data": {
    "studentId": "STD001",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    // ... other fields
  }
}
```

---

## Student Profile Endpoints

### 7. Get Profile
**GET** `/students/profile`

Get current student's complete profile.

**Headers:**
```
Authorization: Bearer {token}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "studentId": "STD001",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "+441234567890",
    "dateOfBirth": "2000-01-15",
    "gender": "Male",
    "address": "123 Main St",
    "city": "London",
    "country": "United Kingdom",
    "degree": "Bachelor of Science",
    "institution": "University of London",
    "graduationYear": 2023,
    "gpa": 3.8,
    "ieltsScore": 7.5,
    "englishLevel": "Advanced",
    "workExperience": [
      {
        "title": "Software Developer",
        "company": "Tech Corp",
        "startDate": "2023-01",
        "endDate": "Present",
        "description": "Full-stack development"
      }
    ],
    "skills": ["JavaScript", "React", "Node.js", "PostgreSQL"],
    "coursesOfInterest": [
      {
        "courseName": "Computer Science",
        "level": "Master's",
        "university": "University of Oxford"
      }
    ],
    "locationInterests": ["London", "Oxford", "Cambridge"],
    "github": "https://github.com/johndoe",
    "linkedin": "https://linkedin.com/in/johndoe",
    "portfolio": "https://johndoe.dev",
    "cvPath": "uploads/cv/cv-STD001-1698500000000.pdf",
    "profilePicturePath": "uploads/profilePictures/profile-STD001-1698500000000.jpg",
    "status": "Active",
    "createdDate": "2025-10-28T10:30:00.000Z"
  }
}
```

---

### 8. Update Profile
**PUT** `/students/profile`

Update student profile information.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body (all fields optional):**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+441234567890",
  "dateOfBirth": "2000-01-15",
  "gender": "Male",
  "address": "123 Main St",
  "city": "London",
  "country": "United Kingdom",
  "degree": "Bachelor of Science",
  "institution": "University of London",
  "graduationYear": 2023,
  "gpa": 3.8,
  "ieltsScore": 7.5,
  "englishLevel": "Advanced",
  "workExperience": [
    {
      "title": "Software Developer",
      "company": "Tech Corp",
      "startDate": "2023-01",
      "endDate": "Present",
      "description": "Full-stack development"
    }
  ],
  "skills": ["JavaScript", "React", "Node.js"],
  "coursesOfInterest": [
    {
      "courseName": "Computer Science",
      "level": "Master's",
      "university": "University of Oxford"
    }
  ],
  "locationInterests": ["London", "Oxford"],
  "github": "https://github.com/johndoe",
  "linkedin": "https://linkedin.com/in/johndoe",
  "portfolio": "https://johndoe.dev"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": { /* updated student object */ }
}
```

---

### 9. Upload CV
**POST** `/students/cv/upload`

Upload CV file (PDF, DOC, DOCX).

**Headers:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Form Data:**
- `cv`: File (Max 10MB, PDF/DOC/DOCX only)

**Success Response (200):**
```json
{
  "success": true,
  "message": "CV uploaded successfully",
  "data": {
    "cvPath": "uploads/cv/cv-STD001-1698500000000.pdf",
    "fileName": "cv-STD001-1698500000000.pdf"
  }
}
```

---

### 10. Extract CV Data
**POST** `/students/cv/extract`

Extract structured data from uploaded CV using AI.

**Headers:**
```
Authorization: Bearer {token}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "CV data extracted successfully",
  "data": {
    "personalInfo": {
      "email": "john.doe@example.com",
      "phone": "+441234567890"
    },
    "education": [
      {
        "degree": "Bachelor of Science in Computer Science",
        "institution": "University of London",
        "graduationYear": 2023
      }
    ],
    "workExperience": [
      {
        "title": "Software Developer",
        "company": "Tech Corp",
        "startDate": "2023",
        "endDate": "Present",
        "description": "Full-stack development"
      }
    ],
    "skills": ["JavaScript", "React", "Node.js", "Python"],
    "references": {
      "github": "https://github.com/johndoe",
      "linkedin": "https://linkedin.com/in/johndoe"
    }
  }
}
```

---

### 11. Delete CV
**DELETE** `/students/cv`

Delete uploaded CV file.

**Headers:**
```
Authorization: Bearer {token}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "CV deleted successfully"
}
```

---

### 12. Upload Profile Picture
**POST** `/students/profile-picture`

Upload profile picture (JPG, PNG).

**Headers:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Form Data:**
- `profilePicture`: File (Max 5MB, JPG/PNG only)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile picture uploaded successfully",
  "data": {
    "profilePicturePath": "uploads/profilePictures/profile-STD001-1698500000000.jpg",
    "fileName": "profile-STD001-1698500000000.jpg"
  }
}
```

---

## Error Responses

All endpoints may return error responses in the following format:

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Validation failed",
  "error": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Invalid token"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Student not found"
}
```

**409 Conflict:**
```json
{
  "success": false,
  "message": "Student with this email already exists"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## Rate Limiting

- **Limit**: 100 requests per 15 minutes per IP
- **Header**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`

**429 Too Many Requests:**
```json
{
  "success": false,
  "message": "Too many requests from this IP, please try again later."
}
```

---

## File Upload Specifications

### CV Files
- **Formats**: PDF, DOC, DOCX
- **Max Size**: 10 MB
- **Field Name**: `cv`

### Profile Pictures
- **Formats**: JPG, JPEG, PNG
- **Max Size**: 5 MB
- **Field Name**: `profilePicture`

---

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Tokens expire after 7 days (configurable via `JWT_EXPIRE` in `.env`).

---

## Testing with cURL

### Register
```bash
curl -X POST http://localhost:5001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"firstName":"John","lastName":"Doe","email":"john@example.com","password":"SecurePass123!","phone":"+441234567890"}'
```

### Login
```bash
curl -X POST http://localhost:5001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"SecurePass123!"}'
```

### Get Profile
```bash
curl -X GET http://localhost:5001/api/v1/students/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Upload CV
```bash
curl -X POST http://localhost:5001/api/v1/students/cv/upload \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "cv=@/path/to/your/cv.pdf"
```

---

## Postman Collection

Import the provided Postman collection for easier testing:
- File: `postman/Mentora_Student_API.postman_collection.json`
- Environment: `postman/Mentora_Student_API_ENV.postman_environment.json`
