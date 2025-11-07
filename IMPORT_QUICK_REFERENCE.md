# 🎓 University Courses Import - Quick Reference

## Your Current Setup

✅ **10 Excel files detected** containing approximately **1,512 university courses**:

1. BPP University - 110 Courses
2. Northumbria University - 223 Courses  
3. Roehampton University - 149 Courses
4. Southampton Solent - 106 Courses
5. Ulster University - 140 Courses
6. University of Bedfordshire - 128 Courses
7. University of Greenwich - 140 Courses
8. University of South Wales - 159 Courses
9. University of Suffolk - 87 Courses
10. University of Worcester - 270 Courses

## Ready to Import!

### Quick Commands

**1. Check what files are ready:**
```bash
node utils/checkImportReady.js
```

**2. Import all courses to MongoDB:**
```bash
node utils/importUniversityCourses.js
```

**3. Verify in MongoDB:**
```bash
mongosh
use mentora-student-db
db.universitycourses.countDocuments()
db.universitycourses.findOne()
```

## What Happens During Import

The tool will:
- ✅ Read all 10 Excel files
- ✅ Process all sheets in each file (Courses, Fees & Intakes, Entry Requirements)
- ✅ Merge data from different sheets using Course_ID/Course_Code
- ✅ Insert new courses or update existing ones
- ✅ Show detailed progress and statistics

## Expected Results

```
📊 Import Summary:
   ✅ New records inserted: ~1,512
   🔄 Records updated: 0
   ❌ Errors: 0 (or minimal)
   📈 Total processed: ~4,536 (3 sheets × 1,512 courses)
```

## Database Schema

Each course will have:

### Basic Info
- universityId, universityName
- courseId (unique), courseName, courseCode
- degreeLevel, studyMode, durationYears
- courseUrl, courseDescription, status

### Fees & Intakes  
- tuitionFeeLocal, tuitionFeeInternational
- startDate1, startDate2, applicationDeadline
- scholarshipAvailable, scholarshipAmount

### Entry Requirements
- academicRequirements, minimumGpa
- ieltsOverall, ieltsReading, ieltsWriting, ieltsListening, ieltsSpeaking
- toeflOverall, pteOverall
- prerequisites, workExperience, otherRequirements

## After Import - API Integration

### 1. Create API Route

Add to `routes/courseRoutes.js`:
```javascript
const express = require('express');
const router = express.Router();
const UniversityCourse = require('../models/UniversityCourse');

// Get all courses with filters
router.get('/courses', async (req, res) => {
  try {
    const { 
      university, 
      degreeLevel, 
      studyMode,
      minFee,
      maxFee,
      search 
    } = req.query;
    
    const query = {};
    
    if (university) query.universityName = new RegExp(university, 'i');
    if (degreeLevel) query.degreeLevel = degreeLevel;
    if (studyMode) query.studyMode = studyMode;
    if (minFee || maxFee) {
      query.tuitionFeeInternational = {};
      if (minFee) query.tuitionFeeInternational.$gte = parseFloat(minFee);
      if (maxFee) query.tuitionFeeInternational.$lte = parseFloat(maxFee);
    }
    if (search) {
      query.$or = [
        { courseName: new RegExp(search, 'i') },
        { courseDescription: new RegExp(search, 'i') }
      ];
    }
    
    const courses = await UniversityCourse.find(query).limit(100);
    res.json({ success: true, count: courses.length, courses });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get course by ID
router.get('/courses/:id', async (req, res) => {
  try {
    const course = await UniversityCourse.findOne({ courseId: req.params.id });
    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found' });
    }
    res.json({ success: true, course });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
```

### 2. Course Matching Logic

Match students to courses based on:
- ✅ IELTS scores (compare student.ieltsScore with course.ieltsOverall)
- ✅ Academic requirements (compare student GPA with course.minimumGpa)
- ✅ Field of study (match student interests with course name/description)
- ✅ Budget (compare with tuitionFeeInternational)

### 3. Frontend Integration

Display courses in:
- 🎯 Course Finder page with filters
- 📊 Recommended Courses based on student profile
- 🔍 Search functionality
- 💰 Budget calculator

## Troubleshooting

### If import fails:
1. Check MongoDB is running: `mongosh`
2. Verify Excel files are not corrupted
3. Check file permissions on import-data folder
4. Review error messages in console

### If data looks wrong:
1. Open one Excel file and verify column names
2. Check Course_ID exists and is unique
3. Verify date formats are consistent
4. Check numeric fields don't have text

## Performance Notes

- **Import time**: ~30-60 seconds for 1,500 courses
- **MongoDB size**: ~2-3 MB for 1,500 courses
- **Re-import**: Safe to run multiple times (uses upsert)

---

**Ready to go!** Run `node utils/importUniversityCourses.js` to start importing! 🚀
