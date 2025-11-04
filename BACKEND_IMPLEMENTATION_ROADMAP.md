# Backend Implementation Roadmap

## Document Purpose
This document outlines the backend features that need to be implemented to support the currently mocked frontend functionality in the Student Web Application.

**Current Status**: The frontend (Mentora-Consulting-Student-Web-Core) has mock data and UI for several features that are not yet connected to real backend APIs.

**Target**: Implement these backend features to replace mock data with real, database-driven functionality.

---

## 🎯 Priority Overview

| Priority | Feature | Status | Complexity |
|----------|---------|--------|------------|
| **P0** | University Database & Search | 🔴 Not Started | High |
| **P0** | University Matching Algorithm | 🔴 Not Started | High |
| **P1** | Favorites/Saved Universities | 🔴 Not Started | Medium |
| **P1** | Application System | 🔴 Not Started | High |
| **P2** | Notifications System | 🔴 Not Started | Medium |
| **P2** | Analytics & Tracking | 🔴 Not Started | Low |
| **P3** | Email Notifications | 🔴 Not Started | Medium |
| **P3** | Search Filters | 🔴 Not Started | Medium |

---

## 📊 Current Mock Data in Frontend

### 1. **Dashboard Page** (`DashboardPage.tsx`)

#### Mock Data Currently Used:

```javascript
// Mock matched universities
const matchedUniversities = [
  {
    id: 1,
    name: 'University of Manchester',
    logo: '🎓',
    location: 'Manchester, England',
    matchScore: 98,
    ranking: '#27 in UK',
    tuitionFee: '£24,000/year',
    course: 'MSc Computer Science',
    deadline: '2024-12-15',
    status: 'saved',
    acceptance: '85%',
    students: '40,000+',
  },
  // ... 3 more universities
];

// Mock recent activities
const recentActivities = [
  {
    id: 1,
    action: 'Application submitted',
    university: 'London School of Economics',
    time: '2 hours ago',
    icon: CheckCircle,
    color: 'text-green-500',
  },
  // ... 3 more activities
];

// Mock upcoming deadlines
const upcomingDeadlines = [
  { 
    university: 'Imperial College London', 
    course: 'MSc AI', 
    date: '2024-11-15', 
    daysLeft: 25 
  },
  // ... 2 more deadlines
];

// Mock user stats
const userData = {
  stats: {
    savedUniversities: 0,  // Currently hardcoded
    applications: 0,       // Currently hardcoded
    matches: 0,           // Currently hardcoded
    profileViews: 0,      // Currently hardcoded
  }
};
```

---

## 🚀 Feature Implementation Plan

---

## **P0: University Database & Management**

### 1.1 University Model (`models/University.js`)

**Purpose**: Store comprehensive UK university data

**Schema Design**:

```javascript
const universitySchema = new mongoose.Schema({
  // Basic Information
  universityId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    index: true
  },
  shortName: {
    type: String,
    index: true
  },
  logo: {
    type: String, // URL or emoji
  },
  
  // Location
  location: {
    city: String,
    region: String,
    country: { type: String, default: 'United Kingdom' },
    postcode: String,
    address: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  
  // Rankings & Reputation
  rankings: {
    ukRanking: Number,
    worldRanking: Number,
    researchRating: String, // e.g., "5-star"
    teachingRating: String
  },
  
  // Statistics
  stats: {
    totalStudents: String,
    internationalStudents: String,
    acceptanceRate: String, // e.g., "85%"
    employmentRate: String,
    studentSatisfaction: Number // 1-5
  },
  
  // Facilities & Features
  facilities: [String], // e.g., ["Library", "Sports Center", "Research Labs"]
  accommodation: {
    available: Boolean,
    types: [String],
    averageCost: String
  },
  
  // Contact & Links
  contact: {
    phone: String,
    email: String,
    website: String,
    admissionsEmail: String
  },
  
  // Media
  images: [String], // URLs
  virtualTourUrl: String,
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}, {
  timestamps: true
});
```

**Required Indexes**:
```javascript
universitySchema.index({ name: 'text' });
universitySchema.index({ 'location.city': 1 });
universitySchema.index({ 'rankings.ukRanking': 1 });
```

---

### 1.2 Course Model (`models/Course.js`)

**Purpose**: Store courses/programs offered by universities

**Schema Design**:

```javascript
const courseSchema = new mongoose.Schema({
  // Basic Information
  courseId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  universityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'University',
    required: true,
    index: true
  },
  
  // Course Details
  name: {
    type: String,
    required: true,
    index: true
  },
  level: {
    type: String,
    enum: ['Foundation', 'Bachelor\'s', 'Master\'s', 'PhD', 'Diploma', 'Certificate'],
    required: true,
    index: true
  },
  duration: String, // e.g., "1 year", "3 years"
  mode: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Online', 'Hybrid']
  },
  
  // Academic Information
  field: {
    type: String,
    required: true,
    index: true
  }, // e.g., "Computer Science", "Business", "Engineering"
  department: String,
  qualification: String, // e.g., "MSc", "BSc", "MBA"
  
  // Entry Requirements
  entryRequirements: {
    minimumGPA: Number,
    minimumIELTS: Number,
    otherRequirements: [String],
    workExperienceRequired: Boolean,
    workExperienceYears: Number
  },
  
  // Financial
  fees: {
    tuitionFee: String, // e.g., "£24,000/year"
    tuitionFeeAmount: Number, // Numeric for calculations
    currency: { type: String, default: 'GBP' },
    applicationFee: String,
    scholarshipsAvailable: Boolean
  },
  
  // Dates
  intakes: [{
    month: String, // e.g., "September", "January"
    applicationDeadline: Date,
    startDate: Date
  }],
  
  // Content
  description: String,
  modules: [String],
  careerProspects: [String],
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}, {
  timestamps: true
});
```

**Required Indexes**:
```javascript
courseSchema.index({ name: 'text', description: 'text' });
courseSchema.index({ field: 1, level: 1 });
courseSchema.index({ universityId: 1, field: 1 });
```

---

### 1.3 University Search API

**Endpoints Required**:

#### **GET /api/v1/universities/search**
**Purpose**: Search and filter universities

**Query Parameters**:
```javascript
{
  q: String,              // Search query
  city: String,           // Filter by city
  ranking: Number,        // Max UK ranking
  minRanking: Number,     // Min UK ranking
  field: String,          // Field of study
  level: String,          // Course level
  maxFee: Number,         // Maximum tuition fee
  minFee: Number,         // Minimum tuition fee
  acceptanceRate: String, // e.g., "high", "medium", "low"
  page: Number,           // Pagination
  limit: Number,          // Results per page
  sortBy: String,         // 'ranking', 'fee', 'name', 'matchScore'
  sortOrder: String       // 'asc', 'desc'
}
```

**Response**:
```javascript
{
  success: true,
  data: {
    universities: [
      {
        universityId: "UNI001",
        name: "University of Manchester",
        location: {
          city: "Manchester",
          region: "England"
        },
        logo: "https://...",
        rankings: {
          ukRanking: 27
        },
        stats: {
          totalStudents: "40,000+",
          acceptanceRate: "85%"
        },
        matchScore: 95, // Calculated if student is authenticated
        coursesCount: 234
      }
    ],
    pagination: {
      currentPage: 1,
      totalPages: 10,
      totalResults: 150,
      limit: 15
    }
  }
}
```

**Implementation** (`controllers/universityController.js`):
```javascript
const searchUniversities = async (req, res) => {
  try {
    const {
      q,
      city,
      ranking,
      minRanking,
      field,
      level,
      maxFee,
      minFee,
      page = 1,
      limit = 15,
      sortBy = 'ranking',
      sortOrder = 'asc'
    } = req.query;

    // Build query
    const query = { isActive: true };
    
    if (q) {
      query.$text = { $search: q };
    }
    
    if (city) {
      query['location.city'] = new RegExp(city, 'i');
    }
    
    if (ranking) {
      query['rankings.ukRanking'] = { $lte: parseInt(ranking) };
    }
    
    if (minRanking) {
      query['rankings.ukRanking'] = { 
        ...query['rankings.ukRanking'], 
        $gte: parseInt(minRanking) 
      };
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [universities, total] = await Promise.all([
      University.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      University.countDocuments(query)
    ]);

    // If student is authenticated, calculate match scores
    if (req.student) {
      for (let uni of universities) {
        uni.matchScore = await calculateMatchScore(req.student, uni);
      }
    }

    res.json({
      success: true,
      data: {
        universities,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalResults: total,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('University search error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search universities'
    });
  }
};
```

---

#### **GET /api/v1/universities/:id**
**Purpose**: Get detailed university information

**Response**:
```javascript
{
  success: true,
  data: {
    university: {
      // Full university details
    },
    courses: [
      // Available courses
    ],
    relatedUniversities: [
      // Similar universities
    ]
  }
}
```

---

#### **GET /api/v1/courses/search**
**Purpose**: Search courses across universities

**Query Parameters**: Similar to university search + university-specific filters

---

## **P0: University Matching Algorithm**

### 2.1 Match Score Calculation

**Purpose**: Calculate how well a university/course matches a student's profile

**Algorithm Design**:

```javascript
// services/matchingService.js

const calculateMatchScore = async (student, university) => {
  let score = 0;
  let maxScore = 100;

  // 1. Location Match (20 points)
  if (student.locationInterests && student.locationInterests.length > 0) {
    if (student.locationInterests.includes(university.location.city)) {
      score += 20;
    } else {
      // Partial match if in same region
      const cityMatch = student.locationInterests.some(loc => 
        university.location.region.includes(loc)
      );
      if (cityMatch) score += 10;
    }
  }

  // 2. Course/Field Match (30 points)
  if (student.coursesOfInterest && student.coursesOfInterest.length > 0) {
    const courseMatch = await Course.findOne({
      universityId: university._id,
      field: { $in: student.coursesOfInterest.map(c => c.courseName) }
    });
    if (courseMatch) {
      score += 30;
    }
  }

  // 3. Academic Qualification Match (25 points)
  if (student.education && student.education.length > 0) {
    const latestEducation = student.education[0];
    const gpa = parseFloat(latestEducation.gpa);
    
    // Check if student meets typical entry requirements
    const courses = await Course.find({ 
      universityId: university._id,
      'entryRequirements.minimumGPA': { $lte: gpa }
    });
    
    if (courses.length > 0) {
      score += 25;
    } else if (courses.length > 0 && gpa >= 3.0) {
      score += 15; // Partial match
    }
  }

  // 4. English Proficiency Match (15 points)
  if (student.ieltsScore) {
    const ielts = parseFloat(student.ieltsScore);
    if (ielts >= 7.0) {
      score += 15;
    } else if (ielts >= 6.5) {
      score += 10;
    } else if (ielts >= 6.0) {
      score += 5;
    }
  }

  // 5. Ranking Preference (10 points)
  if (university.rankings.ukRanking <= 30) {
    score += 10;
  } else if (university.rankings.ukRanking <= 50) {
    score += 7;
  } else if (university.rankings.ukRanking <= 100) {
    score += 4;
  }

  return Math.min(Math.round(score), maxScore);
};
```

---

### 2.2 Matched Universities API

**Endpoint**: **GET /api/v1/students/matches**

**Purpose**: Get personalized university matches for authenticated student

**Response**:
```javascript
{
  success: true,
  data: {
    matches: [
      {
        university: {
          // University details
        },
        matchScore: 98,
        matchReasons: [
          "Located in Manchester - one of your preferred cities",
          "Offers MSc Computer Science - matches your interests",
          "Your GPA exceeds entry requirements",
          "Top 30 UK university"
        ],
        recommendedCourses: [
          {
            // Course details
          }
        ]
      }
    ],
    matchStats: {
      perfectMatches: 5,    // 90-100%
      goodMatches: 12,      // 75-89%
      fairMatches: 23,      // 60-74%
      totalMatches: 40
    }
  }
}
```

**Implementation**:
```javascript
const getStudentMatches = async (req, res) => {
  try {
    const student = req.student;

    // Fetch universities
    let universities = await University.find({ isActive: true }).lean();

    // Calculate match scores for each
    const matchPromises = universities.map(async (uni) => {
      const score = await calculateMatchScore(student, uni);
      
      // Get matching courses
      const courses = await Course.find({
        universityId: uni._id,
        field: { $in: student.coursesOfInterest?.map(c => c.courseName) || [] },
        isActive: true
      }).limit(3);

      return {
        university: uni,
        matchScore: score,
        recommendedCourses: courses
      };
    });

    let matches = await Promise.all(matchPromises);

    // Filter and sort
    matches = matches
      .filter(m => m.matchScore >= 60) // Only show 60%+ matches
      .sort((a, b) => b.matchScore - a.matchScore);

    // Calculate stats
    const matchStats = {
      perfectMatches: matches.filter(m => m.matchScore >= 90).length,
      goodMatches: matches.filter(m => m.matchScore >= 75 && m.matchScore < 90).length,
      fairMatches: matches.filter(m => m.matchScore >= 60 && m.matchScore < 75).length,
      totalMatches: matches.length
    };

    res.json({
      success: true,
      data: {
        matches: matches.slice(0, 20), // Top 20 matches
        matchStats
      }
    });
  } catch (error) {
    console.error('Match calculation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate matches'
    });
  }
};
```

---

## **P1: Favorites/Saved Universities**

### 3.1 Favorites Model

**Update Student Model** to include:

```javascript
// Add to StudentMongo.js
favoriteUniversities: [{
  universityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'University'
  },
  notes: String,
  savedAt: {
    type: Date,
    default: Date.now
  }
}]
```

---

### 3.2 Favorites API Endpoints

#### **POST /api/v1/students/favorites**
**Purpose**: Add university to favorites

**Request**:
```javascript
{
  universityId: "673abc123...",
  notes: "Great program, need to check deadlines"
}
```

**Response**:
```javascript
{
  success: true,
  message: "University added to favorites",
  data: {
    favoriteCount: 5
  }
}
```

---

#### **DELETE /api/v1/students/favorites/:universityId**
**Purpose**: Remove university from favorites

---

#### **GET /api/v1/students/favorites**
**Purpose**: Get all saved universities

**Response**:
```javascript
{
  success: true,
  data: {
    favorites: [
      {
        university: {
          // Full university details
        },
        notes: "Great program",
        savedAt: "2024-11-01T10:30:00Z",
        matchScore: 95
      }
    ],
    count: 5
  }
}
```

**Implementation**:
```javascript
const getFavorites = async (req, res) => {
  try {
    const student = await Student.findById(req.studentId)
      .populate('favoriteUniversities.universityId')
      .lean();

    const favorites = await Promise.all(
      student.favoriteUniversities.map(async (fav) => {
        const matchScore = await calculateMatchScore(student, fav.universityId);
        return {
          university: fav.universityId,
          notes: fav.notes,
          savedAt: fav.savedAt,
          matchScore
        };
      })
    );

    res.json({
      success: true,
      data: {
        favorites,
        count: favorites.length
      }
    });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve favorites'
    });
  }
};
```

---

## **P1: Application System**

### 4.1 Application Model (`models/Application.js`)

**Schema Design**:

```javascript
const applicationSchema = new mongoose.Schema({
  // Reference IDs
  applicationId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
    index: true
  },
  universityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'University',
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  
  // Application Details
  intake: {
    month: String,
    year: Number,
    startDate: Date
  },
  deadline: Date,
  
  // Status
  status: {
    type: String,
    enum: [
      'draft',           // Not submitted yet
      'submitted',       // Submitted, awaiting review
      'under_review',    // Being reviewed by university
      'additional_info', // Additional documents requested
      'interview',       // Interview scheduled
      'offer_received',  // Conditional/unconditional offer
      'accepted',        // Student accepted offer
      'rejected',        // Application rejected
      'withdrawn',       // Student withdrew application
      'expired'          // Deadline passed
    ],
    default: 'draft',
    index: true
  },
  
  // Timeline
  statusHistory: [{
    status: String,
    date: Date,
    notes: String
  }],
  
  submittedAt: Date,
  reviewedAt: Date,
  decidedAt: Date,
  
  // Documents
  documents: [{
    type: {
      type: String,
      enum: ['CV', 'Personal Statement', 'Transcript', 'Recommendation Letter', 'Portfolio', 'Other']
    },
    filePath: String,
    fileName: String,
    uploadedAt: Date
  }],
  
  // Personal Statement
  personalStatement: String,
  
  // Additional Info
  fundingSource: String,
  visaRequired: Boolean,
  accommodationNeeded: Boolean,
  
  // University Response
  offerDetails: {
    type: String, // 'conditional', 'unconditional'
    conditions: [String],
    tuitionFee: String,
    scholarshipOffered: Boolean,
    scholarshipAmount: String,
    responseDeadline: Date
  },
  
  // Notes
  studentNotes: String,
  adminNotes: String,
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}, {
  timestamps: true
});
```

**Indexes**:
```javascript
applicationSchema.index({ studentId: 1, status: 1 });
applicationSchema.index({ deadline: 1 });
applicationSchema.index({ submittedAt: -1 });
```

---

### 4.2 Application API Endpoints

#### **POST /api/v1/applications**
**Purpose**: Create new application (draft)

**Request**:
```javascript
{
  universityId: "673abc...",
  courseId: "673def...",
  intake: {
    month: "September",
    year: 2025
  },
  personalStatement: "I am passionate about...",
  fundingSource: "Self-funded"
}
```

---

#### **GET /api/v1/applications**
**Purpose**: Get all student applications

**Query Parameters**:
- `status`: Filter by status
- `sortBy`: 'deadline', 'submittedAt', 'status'

**Response**:
```javascript
{
  success: true,
  data: {
    applications: [
      {
        applicationId: "APP2024001",
        university: {
          // University details
        },
        course: {
          // Course details
        },
        status: "under_review",
        submittedAt: "2024-10-15T14:30:00Z",
        deadline: "2024-11-15T23:59:59Z",
        daysUntilDeadline: 11
      }
    ],
    stats: {
      total: 5,
      draft: 1,
      submitted: 2,
      underReview: 1,
      offerReceived: 1
    }
  }
}
```

---

#### **GET /api/v1/applications/:id**
**Purpose**: Get specific application details

---

#### **PUT /api/v1/applications/:id**
**Purpose**: Update application

---

#### **POST /api/v1/applications/:id/submit**
**Purpose**: Submit draft application

---

#### **POST /api/v1/applications/:id/withdraw**
**Purpose**: Withdraw application

---

#### **POST /api/v1/applications/:id/accept-offer**
**Purpose**: Accept university offer

---

#### **POST /api/v1/applications/:id/documents**
**Purpose**: Upload supporting documents

---

## **P2: Activity Tracking**

### 5.1 Activity Model (`models/Activity.js`)

**Schema Design**:

```javascript
const activitySchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
    index: true
  },
  
  type: {
    type: String,
    enum: [
      'profile_updated',
      'cv_uploaded',
      'university_saved',
      'university_unsaved',
      'application_created',
      'application_submitted',
      'application_status_changed',
      'document_uploaded',
      'search_performed'
    ],
    required: true,
    index: true
  },
  
  action: String, // Human-readable action
  
  relatedEntity: {
    entityType: String, // 'university', 'course', 'application'
    entityId: mongoose.Schema.Types.ObjectId,
    entityName: String
  },
  
  metadata: mongoose.Schema.Types.Mixed, // Additional data
  
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: false
});
```

---

### 5.2 Activity Tracking API

#### **GET /api/v1/students/activities**
**Purpose**: Get student activity timeline

**Query Parameters**:
- `limit`: Number of activities (default: 20)
- `type`: Filter by activity type

**Response**:
```javascript
{
  success: true,
  data: {
    activities: [
      {
        id: "act001",
        type: "application_submitted",
        action: "Application submitted",
        relatedEntity: {
          entityType: "university",
          entityName: "London School of Economics"
        },
        timestamp: "2024-11-04T10:30:00Z",
        timeAgo: "2 hours ago"
      }
    ]
  }
}
```

**Implementation** (Middleware to auto-track):
```javascript
// middlewares/activityTracking.js

const trackActivity = (type, getDetails) => {
  return async (req, res, next) => {
    // Store original send
    const originalSend = res.json;
    
    res.json = function(data) {
      // Log activity after successful response
      if (data.success && req.studentId) {
        const details = getDetails(req, data);
        
        Activity.create({
          studentId: req.studentId,
          type,
          action: details.action,
          relatedEntity: details.relatedEntity,
          metadata: details.metadata
        }).catch(err => console.error('Activity tracking error:', err));
      }
      
      // Call original
      return originalSend.call(this, data);
    };
    
    next();
  };
};

// Usage in routes
router.post('/favorites',
  authenticateStudent,
  trackActivity('university_saved', (req) => ({
    action: 'Saved to favorites',
    relatedEntity: {
      entityType: 'university',
      entityId: req.body.universityId
    }
  })),
  addToFavorites
);
```

---

## **P2: Deadlines & Notifications**

### 6.1 Get Upcoming Deadlines

#### **GET /api/v1/students/deadlines**
**Purpose**: Get upcoming application deadlines

**Response**:
```javascript
{
  success: true,
  data: {
    deadlines: [
      {
        application: {
          // Application details
        },
        university: {
          name: "Imperial College London",
          logo: "https://..."
        },
        course: {
          name: "MSc Artificial Intelligence"
        },
        deadline: "2024-11-15T23:59:59Z",
        daysLeft: 11,
        urgency: "medium" // 'critical' (<7 days), 'medium' (<30 days), 'normal' (>30 days)
      }
    ]
  }
}
```

**Implementation**:
```javascript
const getUpcomingDeadlines = async (req, res) => {
  try {
    const now = new Date();
    const in90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    const applications = await Application.find({
      studentId: req.studentId,
      status: { $in: ['draft', 'submitted', 'additional_info'] },
      deadline: { $gte: now, $lte: in90Days }
    })
      .populate('universityId')
      .populate('courseId')
      .sort({ deadline: 1 })
      .lean();

    const deadlines = applications.map(app => {
      const daysLeft = Math.ceil(
        (app.deadline - now) / (1000 * 60 * 60 * 24)
      );
      
      let urgency = 'normal';
      if (daysLeft <= 7) urgency = 'critical';
      else if (daysLeft <= 30) urgency = 'medium';

      return {
        application: app,
        university: app.universityId,
        course: app.courseId,
        deadline: app.deadline,
        daysLeft,
        urgency
      };
    });

    res.json({
      success: true,
      data: { deadlines }
    });
  } catch (error) {
    console.error('Get deadlines error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve deadlines'
    });
  }
};
```

---

### 6.2 Notification System

#### **Notification Model** (`models/Notification.js`)

```javascript
const notificationSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
    index: true
  },
  
  type: {
    type: String,
    enum: [
      'deadline_reminder',
      'application_status_update',
      'new_match',
      'offer_received',
      'document_requested',
      'system_announcement'
    ],
    required: true
  },
  
  title: String,
  message: String,
  
  relatedEntity: {
    entityType: String,
    entityId: mongoose.Schema.Types.ObjectId
  },
  
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  
  readAt: Date,
  
  actionUrl: String, // URL to navigate to
  
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: false
});
```

---

#### **GET /api/v1/notifications**
**Purpose**: Get user notifications

**Query Parameters**:
- `unreadOnly`: true/false
- `limit`: Number of notifications

**Response**:
```javascript
{
  success: true,
  data: {
    notifications: [
      {
        id: "notif001",
        type: "deadline_reminder",
        title: "Application Deadline Approaching",
        message: "Your application to Imperial College London is due in 7 days",
        priority: "high",
        isRead: false,
        actionUrl: "/applications/app123",
        createdAt: "2024-11-04T09:00:00Z"
      }
    ],
    unreadCount: 3
  }
}
```

---

#### **POST /api/v1/notifications/:id/read**
**Purpose**: Mark notification as read

---

#### **Background Job for Deadline Reminders**:

```javascript
// jobs/deadlineReminders.js

const cron = require('node-cron');

// Run daily at 9 AM
cron.schedule('0 9 * * *', async () => {
  console.log('Running deadline reminder job...');
  
  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  // Find applications with deadlines in next 7 days
  const applications = await Application.find({
    status: { $in: ['draft', 'submitted', 'additional_info'] },
    deadline: { $gte: now, $lte: in7Days }
  }).populate('universityId courseId');
  
  for (const app of applications) {
    const daysLeft = Math.ceil((app.deadline - now) / (1000 * 60 * 60 * 24));
    
    // Create notification
    await Notification.create({
      studentId: app.studentId,
      type: 'deadline_reminder',
      title: 'Application Deadline Approaching',
      message: `Your application to ${app.universityId.name} for ${app.courseId.name} is due in ${daysLeft} days`,
      priority: daysLeft <= 3 ? 'critical' : 'high',
      relatedEntity: {
        entityType: 'application',
        entityId: app._id
      },
      actionUrl: `/applications/${app.applicationId}`
    });
    
    // Send email notification
    // await sendEmailNotification(app.studentId, ...);
  }
  
  console.log(`Created ${applications.length} deadline reminders`);
});
```

---

## **P2: Statistics & Analytics**

### 7.1 Student Statistics API

#### **GET /api/v1/students/stats**
**Purpose**: Get student dashboard statistics

**Response**:
```javascript
{
  success: true,
  data: {
    stats: {
      savedUniversities: 5,
      applications: {
        total: 8,
        draft: 2,
        submitted: 3,
        underReview: 2,
        offerReceived: 1
      },
      matches: 42,
      perfectMatches: 12,
      profileViews: 0, // Future feature
      profileCompletion: 95
    },
    recentMilestones: [
      {
        type: "first_application",
        date: "2024-10-15T14:30:00Z",
        description: "Submitted your first application"
      }
    ]
  }
}
```

**Implementation**:
```javascript
const getStudentStats = async (req, res) => {
  try {
    const studentId = req.studentId;
    
    // Get saved universities count
    const student = await Student.findById(studentId).lean();
    const savedUniversities = student.favoriteUniversities?.length || 0;
    
    // Get applications stats
    const applications = await Application.find({ studentId }).lean();
    const applicationStats = {
      total: applications.length,
      draft: applications.filter(a => a.status === 'draft').length,
      submitted: applications.filter(a => a.status === 'submitted').length,
      underReview: applications.filter(a => a.status === 'under_review').length,
      offerReceived: applications.filter(a => a.status === 'offer_received').length
    };
    
    // Get matches count
    const universities = await University.find({ isActive: true }).lean();
    const matchPromises = universities.map(uni => 
      calculateMatchScore(student, uni)
    );
    const scores = await Promise.all(matchPromises);
    const matches = scores.filter(s => s >= 60).length;
    const perfectMatches = scores.filter(s => s >= 90).length;
    
    // Profile completion
    const profileCompletion = calculateProfileCompletion(student);
    
    res.json({
      success: true,
      data: {
        stats: {
          savedUniversities,
          applications: applicationStats,
          matches,
          perfectMatches,
          profileViews: 0, // TODO: Implement view tracking
          profileCompletion
        }
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve statistics'
    });
  }
};
```

---

## **P3: Email Notifications**

### 8.1 Email Templates

**Required Templates** (using nodemailer + handlebars):

1. **Application Submitted Confirmation**
2. **Application Status Update**
3. **Deadline Reminder** (7 days, 3 days, 1 day before)
4. **Offer Received Notification**
5. **New Match Alert** (weekly digest)
6. **Profile Completion Reminder**

**Example Implementation**:
```javascript
// utils/emailTemplates.js

const sendApplicationConfirmation = async (student, application) => {
  const html = `
    <h1>Application Submitted Successfully</h1>
    <p>Dear ${student.firstName},</p>
    <p>Your application to ${application.university.name} for ${application.course.name} has been submitted successfully.</p>
    <p><strong>Application ID:</strong> ${application.applicationId}</p>
    <p><strong>Deadline:</strong> ${formatDate(application.deadline)}</p>
    <p>You can track your application status in your dashboard.</p>
  `;
  
  await sendEmail({
    to: student.email,
    subject: 'Application Submitted - ' + application.university.name,
    html
  });
};
```

---

## **P3: Advanced Search & Filters**

### 9.1 Course-specific Search

#### **GET /api/v1/courses/search**

**Advanced Filters**:
```javascript
{
  q: String,                  // Text search
  universityId: String,       // Specific university
  field: [String],            // Multiple fields
  level: [String],            // Multiple levels
  minFee: Number,
  maxFee: Number,
  duration: String,
  mode: String,               // Full-time, Part-time
  minIELTS: Number,
  maxIELTS: Number,
  hasScholarships: Boolean,
  intakeMonth: String,
  startDateFrom: Date,
  startDateTo: Date
}
```

---

## 📋 Database Seed Data Required

### Universities to Seed (Minimum 50)

**Top UK Universities**:
1. University of Oxford
2. University of Cambridge
3. Imperial College London
4. UCL (University College London)
5. University of Edinburgh
6. University of Manchester
7. King's College London
8. London School of Economics
9. University of Bristol
10. University of Warwick
... (continue to 50+)

**Data Sources**:
- Complete University Guide
- QS World University Rankings
- Times Higher Education
- UCAS

---

### Courses to Seed (Minimum 500)

**Popular Fields**:
- Computer Science (50+ courses)
- Business & Management (50+ courses)
- Engineering (50+ courses)
- Medicine & Healthcare (30+ courses)
- Law (30+ courses)
- Arts & Humanities (30+ courses)
- Sciences (50+ courses)
- Social Sciences (30+ courses)

---

## 🔧 Development Tools Needed

### 1. Data Scraping Scripts
```javascript
// scripts/scrapeUniversities.js
// - Scrape university data from public sources
// - Format for MongoDB import
```

### 2. Database Seeding Scripts
```javascript
// scripts/seedDatabase.js
// - Import universities
// - Import courses
// - Create relationships
```

### 3. Background Jobs Setup
```javascript
// jobs/index.js
// - Deadline reminders
// - Match updates
// - Email digests
```

---

## 🚀 Implementation Priority & Timeline

### **Phase 1: Core Features (2-3 weeks)**
- ✅ University Model & CRUD
- ✅ Course Model & CRUD
- ✅ Basic Search API
- ✅ Seed 50 universities + 500 courses
- ✅ Matching algorithm
- ✅ Matched universities API

### **Phase 2: User Actions (2 weeks)**
- ✅ Favorites system
- ✅ Activity tracking
- ✅ Statistics API
- ✅ Deadlines API

### **Phase 3: Applications (3 weeks)**
- ✅ Application Model
- ✅ Application CRUD APIs
- ✅ Document upload
- ✅ Status workflow

### **Phase 4: Notifications (1 week)**
- ✅ Notification model
- ✅ Notification APIs
- ✅ Background jobs
- ✅ Email templates

### **Phase 5: Advanced Features (2 weeks)**
- ✅ Advanced search filters
- ✅ Email notifications
- ✅ Analytics tracking
- ✅ Performance optimization

---

## 📝 API Routes Summary

```javascript
// Universities
GET    /api/v1/universities/search
GET    /api/v1/universities/:id
GET    /api/v1/universities/:id/courses

// Courses
GET    /api/v1/courses/search
GET    /api/v1/courses/:id

// Student Matches
GET    /api/v1/students/matches

// Favorites
GET    /api/v1/students/favorites
POST   /api/v1/students/favorites
DELETE /api/v1/students/favorites/:universityId

// Applications
GET    /api/v1/applications
POST   /api/v1/applications
GET    /api/v1/applications/:id
PUT    /api/v1/applications/:id
DELETE /api/v1/applications/:id
POST   /api/v1/applications/:id/submit
POST   /api/v1/applications/:id/withdraw
POST   /api/v1/applications/:id/accept-offer
POST   /api/v1/applications/:id/documents

// Statistics
GET    /api/v1/students/stats
GET    /api/v1/students/deadlines
GET    /api/v1/students/activities

// Notifications
GET    /api/v1/notifications
POST   /api/v1/notifications/:id/read
DELETE /api/v1/notifications/:id
```

---

## 🧪 Testing Requirements

### Unit Tests
- Model validations
- Matching algorithm accuracy
- Search query builders

### Integration Tests
- API endpoints
- Database operations
- File uploads

### E2E Tests
- Complete user flows
- Application submission
- Search & filter

---

## 📚 Documentation Needed

1. **API Documentation** (Swagger/Postman)
2. **Database Schema Diagram**
3. **Matching Algorithm Documentation**
4. **Admin Panel Guide** (for university data management)
5. **Email Template Guide**

---

## 🎯 Success Metrics

Once implemented, track:
- Search query performance (<500ms)
- Match calculation speed (<2s for 100 universities)
- API response times
- User engagement (favorites, applications)
- Application completion rate

---

## 📞 Next Steps

1. **Review & Approve** this roadmap
2. **Set up project board** (Jira/Trello) with tasks
3. **Assign priorities** based on business needs
4. **Begin Phase 1** implementation
5. **Set up CI/CD pipeline** for automated testing
6. **Schedule weekly progress reviews**

---

**Document Version**: 1.0  
**Last Updated**: November 4, 2025  
**Author**: Development Team  
**Status**: Draft - Awaiting Approval
