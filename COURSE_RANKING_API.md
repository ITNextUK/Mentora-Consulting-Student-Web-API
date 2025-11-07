# 🎓 Course Ranking & Filtering API Documentation

## Overview

The Course Ranking API provides intelligent course recommendations based on student qualifications and preferences. It uses a sophisticated scoring algorithm to rank courses from 0-100% match.

## Base URL

```
http://localhost:3001/api/v1/courses
```

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 🎯 Main Endpoint: Get Ranked Courses

### POST `/ranked`

Get a ranked list of courses based on student profile.

**Authentication:** Required

**Request Body:**

```json
{
  "ieltsScore": 6.5,
  "budget": 30000,
  "fieldOfInterest": ["Computer Science", "Software Engineering"],
  "preferredDegreeLevel": "Bachelors",
  "preferredStudyMode": "Full-time",
  "preferredUniversities": ["BPP University", "Ulster University"],
  "minScore": 40
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ieltsScore` | Number | No* | Student's IELTS score (0-9) |
| `budget` | Number | No* | Maximum budget in GBP |
| `fieldOfInterest` | String/Array | No* | Area(s) of study interest |
| `preferredDegreeLevel` | String | No | Bachelors, Masters, Doctoral, etc. |
| `preferredStudyMode` | String | No | Full-time or Part-time |
| `preferredUniversities` | Array | No | List of preferred university names |
| `minScore` | Number | No | Minimum match score (default: 30) |

*At least one of: ieltsScore, budget, or fieldOfInterest must be provided

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Found 45 matching courses",
  "count": 45,
  "searchCriteria": {
    "ieltsScore": 6.5,
    "budget": 30000,
    "fieldOfInterest": ["Computer Science"],
    "preferredDegreeLevel": "Bachelors",
    "minScore": 40
  },
  "courses": [
    {
      "rank": 1,
      "matchScore": 85,
      "courseId": "BPP-BSC-CS-001",
      "courseName": "BSc (Hons) Computer Science",
      "universityName": "BPP University",
      "degreeLevel": "Bachelors",
      "studyMode": "Full-time",
      "durationYears": 3,
      "tuitionFeeInternational": 29160,
      "ieltsOverall": 6,
      "ieltsReading": 6,
      "ieltsWriting": 6,
      "ieltsListening": 6,
      "ieltsSpeaking": 6,
      "toeflOverall": 88,
      "pteOverall": 59,
      "startDate1": "2026-09-01",
      "applicationDeadline": "2026-06-30",
      "scholarshipAvailable": "Yes",
      "courseUrl": "https://www.bpp.com/...",
      "matchDetails": {
        "ieltsMatch": 25,
        "budgetMatch": 20,
        "fieldMatch": 25,
        "degreeLevelMatch": 10,
        "studyModeMatch": 5,
        "totalScore": 85,
        "reasons": [
          "IELTS 6.5 meets requirement of 6",
          "Fee £29160 within budget of £30000",
          "Matches interest in Computer Science",
          "Matches preferred degree level: Bachelors"
        ]
      }
    }
  ]
}
```

**Match Score Breakdown:**

The algorithm assigns points across 5 categories (total 100 points):

1. **IELTS Match (30 points)**
   - Well above requirement (≥1.0 over): 30 points
   - Above requirement (≥0.5 over): 25 points
   - Meets requirement: 20 points
   - Close to requirement (≤0.5 below): 10 points
   - Below requirement: 0 points

2. **Budget Match (25 points)**
   - Savings ≥20%: 25 points
   - Savings ≥10%: 20 points
   - Within budget: 15 points
   - Up to 10% over (scholarship potential): 8 points
   - Over budget: 0 points

3. **Field of Interest (25 points)**
   - Exact match in course name: 25 points
   - Match in description: 15 points
   - Multiple interests matched: cumulative (max 25)

4. **Degree Level Match (10 points)**
   - Exact match: 10 points
   - No match: 0 points

5. **Study Mode Match (10 points)**
   - Exact match: 10 points
   - Partial match: 5 points
   - No match: 0 points

---

## 📚 Other Endpoints

### GET `/:courseId`

Get detailed information about a specific course.

**Authentication:** Not required

**Response (200 OK):**

```json
{
  "success": true,
  "course": {
    "courseId": "BPP-BSC-CS-001",
    "courseName": "BSc (Hons) Computer Science",
    "universityName": "BPP University",
    "courseDescription": "Full course description...",
    "tuitionFeeInternational": 29160,
    "ieltsOverall": 6,
    "startDate1": "2026-09-01",
    "applicationDeadline": "2026-06-30",
    "prerequisites": "A-levels or equivalent"
  }
}
```

---

### GET `/meta/universities`

Get list of all available universities.

**Authentication:** Not required

**Response (200 OK):**

```json
{
  "success": true,
  "count": 10,
  "universities": [
    "BPP University",
    "Northumbria University",
    "Ulster University",
    "University of Bedfordshire",
    "..."
  ]
}
```

---

### GET `/meta/degree-levels`

Get list of all available degree levels.

**Authentication:** Not required

**Response (200 OK):**

```json
{
  "success": true,
  "count": 7,
  "degreeLevels": [
    "Bachelors",
    "Masters",
    "Doctoral",
    "Professional Qual.",
    "Postgraduate Certificate",
    "Postgraduate Diploma",
    "Apprenticeship"
  ]
}
```

---

### GET `/meta/stats`

Get overall course statistics.

**Authentication:** Not required

**Response (200 OK):**

```json
{
  "success": true,
  "stats": {
    "totalCourses": 1455,
    "byDegreeLevel": [
      { "_id": "Bachelors", "count": 898 },
      { "_id": "Masters", "count": 436 }
    ],
    "byUniversity": [
      { "_id": "Northumbria University", "count": 222 },
      { "_id": "University of Worcester", "count": 218 }
    ],
    "feeRange": [{
      "minFee": 0,
      "maxFee": 45000,
      "avgFee": 15678
    }],
    "ieltsRange": [{
      "minIELTS": 5.5,
      "maxIELTS": 7.5,
      "avgIELTS": 6.2
    }]
  }
}
```

---

## 💡 Usage Examples

### Example 1: Student with high IELTS, moderate budget

```javascript
const studentProfile = {
  ieltsScore: 7.0,
  budget: 20000,
  fieldOfInterest: "Business",
  preferredDegreeLevel: "Masters"
};

// POST /api/v1/courses/ranked
```

**Result:** Courses requiring IELTS ≤7.5, fee ≤£23,000 (15% over), business-related, Masters level

---

### Example 2: Budget-conscious student

```javascript
const studentProfile = {
  ieltsScore: 6.0,
  budget: 15000,
  fieldOfInterest: ["Accounting", "Finance"],
  preferredStudyMode: "Full-time",
  minScore: 50  // Only show strong matches
};

// POST /api/v1/courses/ranked
```

**Result:** Affordable courses with good IELTS match in accounting/finance

---

### Example 3: Specific university preference

```javascript
const studentProfile = {
  ieltsScore: 6.5,
  fieldOfInterest: "Engineering",
  preferredUniversities: [
    "Ulster University",
    "Northumbria University"
  ]
};

// POST /api/v1/courses/ranked
```

**Result:** Engineering courses only from specified universities

---

## 🔍 Filtering Logic

### Hard Filters (Applied Before Ranking)

1. **IELTS:** Shows courses where requirement ≤ student score + 0.5
2. **Budget:** Shows courses where fee ≤ budget × 1.15 (15% over)
3. **Degree Level:** If specified, only that level
4. **Study Mode:** If specified, only that mode
5. **Universities:** If specified, only those universities

### Soft Filters (Affect Ranking Only)

1. **Field of Interest:** Boosts score for matching courses
2. **Min Score:** Removes courses below threshold from results

---

## 📊 Frontend Integration Example

```javascript
// In your React/Vue component
const fetchRecommendedCourses = async (studentData) => {
  try {
    const response = await axios.post(
      'http://localhost:3001/api/v1/courses/ranked',
      {
        ieltsScore: studentData.ieltsScore,
        budget: studentData.budget,
        fieldOfInterest: studentData.interests,
        preferredDegreeLevel: studentData.degreeLevel,
        minScore: 40
      },
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );

    const { courses } = response.data;
    
    // Display courses in UI
    setCourses(courses);
    
  } catch (error) {
    console.error('Error fetching courses:', error);
  }
};
```

---

## 🚀 Performance Notes

- Results limited to 500 courses before ranking (performance)
- Indexes on key fields for fast queries
- Text search available on course name and description
- Typical response time: 200-500ms

---

## 🛡️ Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "error": "Please provide at least one criterion"
}
```

### 404 Not Found

```json
{
  "success": false,
  "error": "Course not found"
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "error": "Failed to retrieve ranked courses",
  "details": "Error message"
}
```

---

## 🎯 Best Practices

1. **Always provide at least 2-3 criteria** for better matching
2. **Use minScore wisely** - 30-40 for broad search, 60+ for top matches only
3. **Cache university/degree lists** - they don't change often
4. **Show match reasons** to users - helps them understand recommendations
5. **Allow filtering results** on frontend for better UX

---

## 📝 Notes

- All fees in GBP (£)
- IELTS scores: 0-9 scale
- Courses marked as "Inactive" are excluded
- Scholarship availability is informational only
- Application deadlines may vary by intake
