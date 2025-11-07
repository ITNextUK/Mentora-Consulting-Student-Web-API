# Location-Based Course Ranking System

## Overview

The course ranking system now includes **location preferences** as a key factor in matching students with suitable university courses. Students can specify preferred cities or regions, and the system will prioritize courses in those areas.

## 🎯 Scoring Algorithm

The ranking algorithm now uses **110 points total** across 6 categories:

| Category | Weight | Description |
|----------|--------|-------------|
| **IELTS Score** | 25 points | Student's IELTS score vs course requirement |
| **Budget** | 20 points | Course fee vs student's budget |
| **Field of Interest** | 25 points | Course subject alignment with student interests |
| **Degree Level** | 10 points | Bachelors, Masters, PhD match |
| **Study Mode** | 10 points | Full-time, Part-time preference |
| **Location** | 20 points | City/Region preference match |

### Location Scoring Details

- **City Match** (20 points): Course is in student's preferred city
  - Example: Student prefers "London" → Course in London = 20 points
- **Region Match** (12 points): Course is in student's preferred region
  - Example: Student prefers "North East England" → Course in Newcastle = 12 points
- **Multiple Preferences**: Students can specify multiple locations (e.g., ["London", "Manchester", "Edinburgh"])

## 📍 Location Data

### Available Locations

The system currently supports courses from these locations:

| City | Region | Universities | Courses | Avg Fee |
|------|--------|--------------|---------|---------|
| **London** | Greater London | 3 universities | 396 courses | £14,502 |
| **Newcastle upon Tyne** | North East England | 1 university | 222 courses | £20,749 |
| **Worcester** | West Midlands | 1 university | 218 courses | £16,711 |
| **Cardiff** | Wales | 1 university | 159 courses | £14,670 |
| **Belfast** | Northern Ireland | 1 university | 139 courses | £16,236 |
| **Luton** | East of England | 1 university | 128 courses | £14,312 |
| **Southampton** | South East England | 1 university | 106 courses | £13,448 |
| **Ipswich** | East of England | 1 university | 87 courses | £12,931 |

### University-Location Mapping

| University | City | Region |
|------------|------|--------|
| BPP University | London | Greater London |
| Northumbria University | Newcastle upon Tyne | North East England |
| Southampton Solent University | Southampton | South East England |
| Ulster University | Belfast | Northern Ireland |
| University of Bedfordshire | Luton | East of England |
| University of Greenwich | London | Greater London |
| University of Roehampton | London | Greater London |
| University of South Wales | Cardiff | Wales |
| University of Suffolk | Ipswich | East of England |
| University of Worcester | Worcester | West Midlands |

## 🔧 API Usage

### 1. Get Ranked Courses (with Location)

**Endpoint:** `POST /api/v1/courses/ranked`

**Request Body:**
```json
{
  "ieltsScore": 7.0,
  "budget": 25000,
  "fieldOfInterest": ["Computer Science", "Software Engineering"],
  "preferredDegreeLevel": "Bachelors",
  "preferredStudyMode": "Full-time",
  "preferredLocations": ["London", "Manchester"],
  "minScore": 50
}
```

**Response:**
```json
{
  "success": true,
  "courses": [
    {
      "courseName": "BSc (Hons) Computer Science (Data Science)",
      "universityName": "University of Greenwich",
      "city": "London",
      "region": "Greater London",
      "tuitionFeeInternational": 13500,
      "ieltsOverall": 6,
      "matchScore": 100,
      "matchDetails": {
        "ieltsMatch": 25,
        "budgetMatch": 20,
        "fieldMatch": 25,
        "degreeLevelMatch": 10,
        "studyModeMatch": 10,
        "locationMatch": 20,
        "reasons": [
          "✅ IELTS 7 well above requirement of 6",
          "💰 Fee £13,500 well within budget (46% savings)",
          "🎯 Matches interest: Computer Science, Data Science",
          "🎓 Matches degree level: Bachelors",
          "⏰ Matches study mode: Full-time",
          "📍 Located in London"
        ]
      }
    }
  ],
  "count": 25
}
```

### 2. Get Available Cities

**Endpoint:** `GET /api/v1/courses/meta/cities`

**Response:**
```json
{
  "success": true,
  "cities": [
    {
      "city": "London",
      "region": "Greater London",
      "courseCount": 396
    },
    {
      "city": "Newcastle upon Tyne",
      "region": "North East England",
      "courseCount": 222
    }
  ],
  "count": 8
}
```

### 3. Get Available Regions

**Endpoint:** `GET /api/v1/courses/meta/regions`

**Response:**
```json
{
  "success": true,
  "regions": [
    {
      "region": "Greater London",
      "cities": ["London"],
      "courseCount": 396
    },
    {
      "region": "North East England",
      "cities": ["Newcastle upon Tyne"],
      "courseCount": 222
    }
  ],
  "count": 7
}
```

## 📊 Test Results

### Test Case 1: Computer Science Student - London Preference

**Student Profile:**
- IELTS: 7.0
- Budget: £30,000
- Interests: Computer Science, Software Engineering, Data Science
- Location: London

**Top Result:**
- **100% Match** - BSc Computer Science (Data Science) - University of Greenwich
- Fee: £13,500 (55% savings)
- Location: London, Greater London
- All 6 criteria matched perfectly!

### Test Case 2: Business Student - Newcastle Preference

**Student Profile:**
- IELTS: 6.5
- Budget: £22,000
- Interests: Business, Management
- Location: Newcastle, North East England

**Top Result:**
- **88% Match** - BSc Business Management - Northumbria University
- Fee: £20,950
- Location: Newcastle upon Tyne, North East England
- Perfect location match with strong academic fit

## 🎓 Key Benefits

1. **Geographic Preference**: Students can study in their preferred city or region
2. **Cost Considerations**: London vs regional cities (avg £14,502 vs £12,931-£20,749)
3. **Lifestyle Match**: City size, culture, and environment preferences
4. **Family Proximity**: Students can stay close to family or friends
5. **Career Opportunities**: Choose cities with strong job markets in their field

## 🔄 Migration Impact

All 1,455 courses in the database have been enriched with location data:
- ✅ City field populated for all courses
- ✅ Region field populated for all courses
- ✅ Indexes created for efficient location-based queries
- ✅ No disruption to existing functionality

## 🚀 Next Steps

Potential enhancements:
1. Add distance-from-home calculations
2. Include cost-of-living data by city
3. Add climate/weather information
4. Include transportation connectivity scores
5. Add campus facilities and city amenities data
6. Multi-campus university support

## 📝 Summary

The location-based ranking system adds a crucial dimension to course recommendations, allowing students to find the perfect balance between academic fit, affordability, and geographic preferences. With 8 cities across 7 regions, students have diverse options from major metropolitan areas like London to more affordable regional cities.

**Impact:** Location preferences can boost match scores by up to 20 points, making it a significant factor in the overall ranking algorithm.
