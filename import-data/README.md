# University Courses Excel Import Tool

This tool imports university course data from Excel files (.xlsx) into MongoDB.

## 📋 Setup Instructions

### 1. Install Required Package

First, install the `xlsx` package:

```bash
npm install xlsx
```

### 2. Prepare Your Excel Files

Place your Excel files (.xlsx) in this `import-data` folder.

### 3. Excel File Format

Your Excel files should have columns matching these names (case-insensitive):

#### Basic Information (Required)
- `University_ID` or `UniversityID`
- `University_Name` or `UniversityName`
- `Course_ID` or `CourseID` ⭐ **Required - unique identifier**
- `Course_Name` or `CourseName`
- `Course_Code` or `CourseCode`
- `Degree_Level` or `DegreeLevel` (e.g., Bachelors, Masters, PhD)
- `Study_Mode` or `StudyMode` (e.g., Full-time, Part-time)
- `Duration_Years` or `DurationYears`
- `Course_URL` or `CourseURL`
- `Course_Description` or `CourseDescription`
- `Status` (default: Active)

#### Fees & Intakes
- `Tuition_Fee_Local` or `TuitionFeeLocal`
- `Tuition_Fee_International` or `TuitionFeeInternational`
- `Start_Date_1` or `StartDate1`
- `Start_Date_2` or `StartDate2`
- `Application_Deadline` or `ApplicationDeadline`
- `Scholarship_Available` or `ScholarshipAvailable`
- `Scholarship_Amount` or `ScholarshipAmount`

#### Entry Requirements
- `Academic_Requirements` or `AcademicRequirements`
- `Minimum_GPA` or `MinimumGPA`
- `IELTS_Overall` or `IELTSOverall`
- `IELTS_Reading` or `IELTSReading`
- `IELTS_Writing` or `IELTSWriting`
- `IELTS_Listening` or `IELTSListening`
- `IELTS_Speaking` or `IELTSSpeaking`
- `TOEFL_Overall` or `TOEFLOverall`
- `PTE_Overall` or `PTEOverall`
- `Prerequisites`
- `Work_Experience` or `WorkExperience`
- `Other_Requirements` or `OtherRequirements`

### 4. Run the Import

From the API root directory, run:

```bash
node utils/importUniversityCourses.js
```

## 🔄 How It Works

1. **Reads all Excel files** from this `import-data` folder
2. **Processes all sheets** in each workbook
3. **Maps columns** to the MongoDB schema (flexible column naming)
4. **Upserts data** (updates existing records or inserts new ones based on Course_ID)
5. **Reports progress** with detailed statistics

## ✨ Features

- ✅ Supports multiple Excel files
- ✅ Processes all sheets in each workbook
- ✅ Flexible column naming (handles both snake_case and camelCase)
- ✅ Upsert logic (won't create duplicates)
- ✅ Detailed import statistics
- ✅ Error handling for individual rows
- ✅ Progress reporting

## 📊 Output Example

```
═══════════════════════════════════════════════════════════
   University Courses Excel Importer
═══════════════════════════════════════════════════════════

✅ MongoDB Connected Successfully

📁 Found 3 Excel file(s) to import

📖 Reading file: ulster_university_courses.xlsx
   📄 Processing sheet: Courses
   ✓ Found 45 rows in Courses
   📄 Processing sheet: Fees & Intakes
   ✓ Found 45 rows in Fees & Intakes
   📄 Processing sheet: Entry Requirements
   ✓ Found 45 rows in Entry Requirements

📥 Starting import of 135 records...

📊 Import Summary:
   ✅ New records inserted: 45
   🔄 Records updated: 0
   ❌ Errors: 0
   📈 Total processed: 135

✅ Import completed successfully!
```

## ⚠️ Important Notes

- **Course_ID is required** - rows without it will be skipped
- **Upsert logic** - existing courses (same Course_ID) will be updated
- **MongoDB connection** - uses `MONGODB_URI` from environment or defaults to `mongodb://localhost:27017/mentora-student-db`
- **Data validation** - numeric fields are automatically parsed

## 🗄️ Database Collection

Data is stored in: `universitycourses` collection

## 🔧 Troubleshooting

### No data imported?
- Check that your Excel files have the correct column names
- Ensure Course_ID column exists and has values
- Check MongoDB connection

### Duplicate data?
- The tool uses Course_ID as unique identifier
- Re-running will update existing records, not duplicate them

### Column name mismatch?
- The tool accepts both formats: `Column_Name` and `ColumnName`
- If your columns are named differently, edit the `mapExcelToSchema` function in `utils/importUniversityCourses.js`
