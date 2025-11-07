# 🎓 University Courses Import System

## Quick Start Guide

### Step 1: Prepare Your Excel Files

Looking at your spreadsheet images, I can see you have data in the format:
- **Sheet 1**: Courses (University_ID, University_Name, Course_ID, etc.)
- **Sheet 2**: Fees & Intakes
- **Sheet 3**: Entry Requirements

✅ Your current format is **perfect** and will work directly with this tool!

### Step 2: Place Excel Files

1. Copy your `.xlsx` files to: `Mentora-Consulting-Student-Web-API/import-data/`
2. You can add multiple files - the tool will process all of them

### Step 3: Run the Import

Open terminal in the API project folder and run:

```bash
node utils/importUniversityCourses.js
```

### Step 4: Verify Import

The tool will show you:
- ✅ How many records were inserted
- 🔄 How many records were updated
- ❌ Any errors encountered

## 📊 Your Data Structure (Detected from Images)

### Sheet 1: Courses
- University_ID (e.g., UNI0008)
- University_Name (e.g., Ulster University)
- Course_ID (e.g., ULU-BEG-AE-001) ⭐ **This is the unique key**
- Course_Name
- Course_Code
- Degree_Level (Bachelors)
- Study_Mode (Full-time/Part-time)
- Duration_Years (3-4 years)
- Course_URL
- Course_Description
- Status (Active)

### Sheet 2: Fees & Intakes
- Course_Code
- Tuition_Fee_Local (11850)
- Tuition_Fee_International (16320)
- Start_Date_1 (2026-09-21)
- Start_Date_2
- Application_Deadline (2026-06-30)
- Scholarship_Available (Yes)
- Scholarship_Amount

### Sheet 3: Entry Requirements
- Course_Code
- Academic_Requirements (96-112 UCAS points)
- Minimum_GPA (96-120 UCAS points)
- IELTS_Overall (6)
- IELTS_Reading (6)
- IELTS_Writing (6)
- IELTS_Listening (6)
- IELTS_Speaking (6)
- TOEFL_Overall (80)
- PTE_Overall (56)
- Prerequisites
- Work_Experience
- Other_Requirements

## 🔄 How the Tool Handles Your Data

The tool is **smart enough** to:

1. **Process all sheets** in each Excel file
2. **Merge data** from different sheets using Course_ID/Course_Code
3. **Handle missing data** gracefully
4. **Update existing records** if you run it again (no duplicates)
5. **Skip invalid rows** and report them

## 💡 Tips

- **Test with one file first** to make sure everything works
- **Backup your database** before importing large datasets
- **Check the summary** after import to verify counts
- **Re-run safely** - it won't create duplicates (uses Course_ID)

## 🔧 Configuration

The tool uses these MongoDB settings:

- **Connection**: `mongodb://localhost:27017/mentora-student-db` (or from `MONGODB_URI` env variable)
- **Collection**: `universitycourses`

## 📋 Example Output

```
═══════════════════════════════════════════════════════════
   University Courses Excel Importer
═══════════════════════════════════════════════════════════

✅ MongoDB Connected Successfully

📁 Found 1 Excel file(s) to import

📖 Reading file: ulster_university_courses.xlsx
   📄 Processing sheet: Courses
   ✓ Found 20 rows in Courses
   📄 Processing sheet: Fees & Intakes
   ✓ Found 20 rows in Fees & Intakes
   📄 Processing sheet: Entry Requirements
   ✓ Found 45 rows in Entry Requirements

📥 Starting import of 85 records...

📊 Import Summary:
   ✅ New records inserted: 20
   🔄 Records updated: 0
   ❌ Errors: 0
   📈 Total processed: 85

✅ Import completed successfully!
```

## 🚀 Next Steps

After importing:

1. **Verify in MongoDB** - Check the `universitycourses` collection
2. **Create API endpoints** - To query and filter courses
3. **Integrate with frontend** - Display courses to students
4. **Add course matching** - Match students to suitable courses based on their profile

## 📝 Notes

- Your Excel format matches perfectly with what the tool expects
- The Course_ID field is crucial - it must be unique for each course
- Data from different sheets with the same Course_Code will be merged
- Dates and numbers are automatically parsed
