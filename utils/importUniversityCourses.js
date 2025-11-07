const XLSX = require('xlsx');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mentora-student-db', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected Successfully');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

// Define University Course Schema
const universityCourseSchema = new mongoose.Schema({
  // Basic Information
  universityId: { type: String, required: true },
  universityName: { type: String, required: true },
  courseId: { type: String, required: true, unique: true },
  courseName: { type: String, required: true },
  courseCode: { type: String },
  degreeLevel: { type: String }, // Bachelors, Masters, PhD
  studyMode: { type: String }, // Full-time, Part-time
  durationYears: { type: Number },
  courseUrl: { type: String },
  courseDescription: { type: String },
  status: { type: String, default: 'Active' },

  // Fees & Intakes
  tuitionFeeLocal: { type: Number },
  tuitionFeeInternational: { type: Number },
  startDate1: { type: String },
  startDate2: { type: String },
  applicationDeadline: { type: String },
  scholarshipAvailable: { type: String },
  scholarshipAmount: { type: String },

  // Entry Requirements
  academicRequirements: { type: String },
  minimumGpa: { type: String },
  ieltsOverall: { type: Number },
  ieltsReading: { type: Number },
  ieltsWriting: { type: Number },
  ieltsListening: { type: Number },
  ieltsSpeaking: { type: Number },
  toeflOverall: { type: Number },
  pteOverall: { type: Number },
  prerequisites: { type: String },
  workExperience: { type: String },
  otherRequirements: { type: String },

  // Metadata
  importedAt: { type: Date, default: Date.now },
  lastUpdated: { type: Date, default: Date.now }
});

const UniversityCourse = mongoose.model('UniversityCourse', universityCourseSchema);

// Function to read Excel file and convert to JSON
const readExcelFile = (filePath) => {
  try {
    console.log(`\n📖 Reading file: ${path.basename(filePath)}`);
    const workbook = XLSX.readFile(filePath);
    
    // Process all sheets
    const allData = [];
    
    workbook.SheetNames.forEach(sheetName => {
      console.log(`   📄 Processing sheet: ${sheetName}`);
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      // Add sheet name to each record for reference
      jsonData.forEach(row => {
        row._sheetName = sheetName;
      });
      
      allData.push(...jsonData);
      console.log(`   ✓ Found ${jsonData.length} rows in ${sheetName}`);
    });
    
    return allData;
  } catch (error) {
    console.error(`❌ Error reading file ${filePath}:`, error.message);
    return [];
  }
};

// Function to map Excel columns to MongoDB schema
const mapExcelToSchema = (row) => {
  return {
    // Basic Information
    universityId: row.University_ID || row.UniversityID || '',
    universityName: row.University_Name || row.UniversityName || '',
    courseId: row.Course_ID || row.CourseID || '',
    courseName: row.Course_Name || row.CourseName || '',
    courseCode: row.Course_Code || row.CourseCode || '',
    degreeLevel: row.Degree_Level || row.DegreeLevel || '',
    studyMode: row.Study_Mode || row.StudyMode || '',
    durationYears: parseFloat(row.Duration_Years || row.DurationYears || 0) || 0,
    courseUrl: row.Course_URL || row.CourseURL || '',
    courseDescription: row.Course_Description || row.CourseDescription || '',
    status: row.Status || 'Active',

    // Fees & Intakes
    tuitionFeeLocal: parseFloat(row.Tuition_Fee_Local || row.TuitionFeeLocal || 0) || 0,
    tuitionFeeInternational: parseFloat(row.Tuition_Fee_International || row.TuitionFeeInternational || 0) || 0,
    startDate1: row.Start_Date_1 || row.StartDate1 || '',
    startDate2: row.Start_Date_2 || row.StartDate2 || '',
    applicationDeadline: row.Application_Deadline || row.ApplicationDeadline || '',
    scholarshipAvailable: row.Scholarship_Available || row.ScholarshipAvailable || '',
    scholarshipAmount: row.Scholarship_Amount || row.ScholarshipAmount || '',

    // Entry Requirements
    academicRequirements: row.Academic_Requirements || row.AcademicRequirements || '',
    minimumGpa: row.Minimum_GPA || row.MinimumGPA || '',
    ieltsOverall: parseFloat(row.IELTS_Overall || row.IELTSOverall || 0) || 0,
    ieltsReading: parseFloat(row.IELTS_Reading || row.IELTSReading || 0) || 0,
    ieltsWriting: parseFloat(row.IELTS_Writing || row.IELTSWriting || 0) || 0,
    ieltsListening: parseFloat(row.IELTS_Listening || row.IELTSListening || 0) || 0,
    ieltsSpeaking: parseFloat(row.IELTS_Speaking || row.IELTSSpeaking || 0) || 0,
    toeflOverall: parseFloat(row.TOEFL_Overall || row.TOEFLOverall || 0) || 0,
    pteOverall: parseFloat(row.PTE_Overall || row.PTEOverall || 0) || 0,
    prerequisites: row.Prerequisites || '',
    workExperience: row.Work_Experience || row.WorkExperience || '',
    otherRequirements: row.Other_Requirements || row.OtherRequirements || '',
  };
};

// Function to import data to MongoDB
const importData = async (data) => {
  let successCount = 0;
  let errorCount = 0;
  let updatedCount = 0;
  
  console.log(`\n📥 Starting import of ${data.length} records...`);
  
  for (const row of data) {
    try {
      const courseData = mapExcelToSchema(row);
      
      // Skip if no courseId
      if (!courseData.courseId) {
        console.log(`⚠️  Skipping row: No Course ID found`);
        errorCount++;
        continue;
      }
      
      // Use upsert to update if exists, insert if not
      const result = await UniversityCourse.findOneAndUpdate(
        { courseId: courseData.courseId },
        { ...courseData, lastUpdated: new Date() },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      
      if (result) {
        // Check if it was an update or insert
        const existingDoc = await UniversityCourse.findOne({ courseId: courseData.courseId });
        if (existingDoc.importedAt < existingDoc.lastUpdated) {
          updatedCount++;
        } else {
          successCount++;
        }
      }
    } catch (error) {
      console.error(`❌ Error importing row:`, error.message);
      errorCount++;
    }
  }
  
  console.log(`\n📊 Import Summary:`);
  console.log(`   ✅ New records inserted: ${successCount}`);
  console.log(`   🔄 Records updated: ${updatedCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`   📈 Total processed: ${data.length}`);
};

// Main function
const main = async () => {
  try {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('   University Courses Excel Importer');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // Connect to MongoDB
    await connectDB();
    
    // Get the import directory path
    const importDir = path.join(__dirname, '..', 'import-data');
    
    // Check if import directory exists
    if (!fs.existsSync(importDir)) {
      console.log(`📁 Creating import directory: ${importDir}`);
      fs.mkdirSync(importDir, { recursive: true });
      console.log('\n⚠️  Please place your Excel files (.xlsx) in the "import-data" folder');
      console.log('   and run this script again.\n');
      process.exit(0);
    }
    
    // Read all Excel files from the import directory
    const files = fs.readdirSync(importDir).filter(file => 
      file.endsWith('.xlsx') || file.endsWith('.xls')
    );
    
    if (files.length === 0) {
      console.log('⚠️  No Excel files found in the import-data folder');
      console.log('   Please add .xlsx files and run again.\n');
      process.exit(0);
    }
    
    console.log(`📁 Found ${files.length} Excel file(s) to import\n`);
    
    // Process all files
    let allData = [];
    for (const file of files) {
      const filePath = path.join(importDir, file);
      const data = readExcelFile(filePath);
      allData.push(...data);
    }
    
    if (allData.length === 0) {
      console.log('\n⚠️  No data found in Excel files\n');
      process.exit(0);
    }
    
    // Import data to MongoDB
    await importData(allData);
    
    console.log('\n✅ Import completed successfully!\n');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Fatal Error:', error.message);
    mongoose.connection.close();
    process.exit(1);
  }
};

// Run the script
main();
