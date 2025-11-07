# ✅ University Courses Import System - READY TO USE

## 🎯 What I've Created For You

I've built a complete Excel-to-MongoDB import system for your university course data.

## 📦 Files Created

1. **`utils/importUniversityCourses.js`** - Main import script
   - Reads all Excel files from `import-data/` folder
   - Processes all sheets (Courses, Fees & Intakes, Entry Requirements)
   - Maps data to MongoDB schema
   - Handles upserts (updates existing, inserts new)
   - Shows detailed progress and statistics

2. **`utils/checkImportReady.js`** - Quick check script
   - Verifies import-data folder exists
   - Lists all Excel files ready to import
   - Shows file sizes

3. **`import-data/README.md`** - Detailed documentation
4. **`UNIVERSITY_IMPORT_GUIDE.md`** - Quick start guide
5. **`IMPORT_QUICK_REFERENCE.md`** - Complete reference

## ✅ What's Already Ready

Your `import-data` folder contains **10 Excel files** with approximately **1,512 courses**:

```
✅ BPP University (110 courses)
✅ Northumbria University (223 courses)
✅ Roehampton University (149 courses)
✅ Southampton Solent (106 courses)
✅ Ulster University (140 courses)
✅ University of Bedfordshire (128 courses)
✅ University of Greenwich (140 courses)
✅ University of South Wales (159 courses)
✅ University of Suffolk (87 courses)
✅ University of Worcester (270 courses)
```

## 🚀 How to Run

### Step 1: Make sure MongoDB is running

```powershell
# Start MongoDB service (if installed as service)
net start MongoDB

# OR run MongoDB manually
mongod
```

### Step 2: Run the import

```powershell
cd "d:\vihin\Documents\Github\ITNEXT\Mentora-Consulting-Student-Web-API"
node utils/importUniversityCourses.js
```

That's it! The script will:
- Connect to MongoDB
- Read all 10 Excel files
- Process all sheets
- Import/update all courses
- Show detailed statistics

## 📊 Expected Output

```
═══════════════════════════════════════════════════════════
   University Courses Excel Importer
═══════════════════════════════════════════════════════════

✅ MongoDB Connected Successfully

📁 Found 10 Excel file(s) to import

📖 Reading file: BPP_University_110_Courses.xlsx
   📄 Processing sheet: Courses
   ✓ Found 110 rows in Courses
   📄 Processing sheet: Fees & Intakes
   ✓ Found 110 rows in Fees & Intakes
   📄 Processing sheet: Entry Requirements
   ✓ Found 110 rows in Entry Requirements

📖 Reading file: Northumbria_University_223_Courses.xlsx
   ... (continues for all files)

📥 Starting import of 4,536 records...

📊 Import Summary:
   ✅ New records inserted: 1,512
   🔄 Records updated: 0
   ❌ Errors: 0
   📈 Total processed: 4,536

✅ Import completed successfully!
```

## 🗄️ MongoDB Schema

Each course will be stored with this structure:

```javascript
{
  // Basic Information
  universityId: "UNI0008",
  universityName: "Ulster University",
  courseId: "ULU-BEG-AE-001",  // Unique identifier
  courseName: "BEng (Hons) Architectural Engineering",
  courseCode: "ULU-BEG-AE-001",
  degreeLevel: "Bachelors",
  studyMode: "Full-time",
  durationYears: 3,
  courseUrl: "https://www.ulster.ac.uk/...",
  courseDescription: "...",
  status: "Active",
  
  // Fees & Intakes
  tuitionFeeLocal: 11850,
  tuitionFeeInternational: 16320,
  startDate1: "2026-09-21",
  startDate2: "",
  applicationDeadline: "2026-06-30",
  scholarshipAvailable: "Yes",
  scholarshipAmount: "Scholarships up to £3,000 available",
  
  // Entry Requirements
  academicRequirements: "96-112 UCAS points",
  minimumGpa: "96-120 UCAS points",
  ieltsOverall: 6,
  ieltsReading: 6,
  ieltsWriting: 6,
  ieltsListening: 6,
  ieltsSpeaking: 6,
  toeflOverall: 80,
  pteOverall: 56,
  prerequisites: "See specific course",
  workExperience: "Varies by course",
  otherRequirements: "Application form required",
  
  // Metadata
  importedAt: ISODate("2024-11-07T..."),
  lastUpdated: ISODate("2024-11-07T...")
}
```

## 🔍 Verify Import

After running the import, check your data:

```javascript
// In MongoDB shell or Compass
use mentora-student-db

// Count total courses
db.universitycourses.countDocuments()
// Should return: ~1,512

// View a sample course
db.universitycourses.findOne()

// Get courses by university
db.universitycourses.find({ universityName: "Ulster University" }).count()

// Find courses with scholarships
db.universitycourses.find({ scholarshipAvailable: "Yes" }).count()

// Search courses by name
db.universitycourses.find({ 
  courseName: /Engineering/i 
})
```

## 🔄 Re-running Import

Safe to run multiple times:
- ✅ Uses Course_ID as unique key
- ✅ Updates existing records (won't duplicate)
- ✅ Adds new courses not in database
- ✅ Preserves data integrity

## 📝 Next Steps After Import

### 1. Create API Endpoints

Add routes to query courses:
- `GET /api/courses` - List all courses with filters
- `GET /api/courses/:id` - Get course by ID
- `GET /api/courses/search?q=...` - Search courses
- `GET /api/universities` - List all universities

### 2. Add Course Matching

Create logic to match students with suitable courses based on:
- IELTS/TOEFL scores
- GPA/Academic requirements  
- Budget (tuition fees)
- Field of study interests
- Study mode preference

### 3. Frontend Integration

Display in Student Web Core:
- Course finder page
- Recommended courses
- Course details
- Apply to course functionality

## 🛠️ Troubleshooting

### MongoDB not running?
```powershell
# Check if MongoDB is installed
Get-Service -Name MongoDB*

# Start MongoDB
net start MongoDB

# OR check if mongod is in PATH
mongod --version
```

### Import fails?
- Check MongoDB connection string in script
- Verify Excel files are not corrupted
- Check file permissions
- Review error messages

### No data showing?
- Verify Course_ID column exists in Excel
- Check collection name: `universitycourses`
- Check database name: `mentora-student-db`

## 📦 Package Requirements

Already installed:
- ✅ `xlsx@0.20.3` - Excel file processing
- ✅ `mongoose` - MongoDB ODM

## 🎓 Summary

You now have:
1. ✅ Import tool ready to use
2. ✅ 10 Excel files with 1,512 courses ready
3. ✅ MongoDB schema defined
4. ✅ Documentation complete
5. ✅ Verification scripts ready

**Just run:** `node utils/importUniversityCourses.js` 🚀

---

**Pro Tips:**
- Test with one file first (move others temporarily)
- Backup your database before large imports
- Check the summary statistics after import
- Use MongoDB Compass for visual verification
