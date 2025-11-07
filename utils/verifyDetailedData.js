const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB Atlas\n');
  } catch (error) {
    console.error('❌ Connection Error:', error.message);
    process.exit(1);
  }
};

// Define schema
const universityCourseSchema = new mongoose.Schema({}, { strict: false, collection: 'universitycourses' });
const UniversityCourse = mongoose.model('UniversityCourse', universityCourseSchema);

const main = async () => {
  await connectDB();
  
  console.log('═══════════════════════════════════════════════════════════');
  console.log('   Detailed Course Data Sample');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  // Get a sample course with all fields
  const course = await UniversityCourse.findOne({ courseCode: 'BPP-BSC-AFDB-001' });
  
  if (!course) {
    console.log('⚠️  Course not found, getting any sample...');
    const anyCourse = await UniversityCourse.findOne();
    console.log('\n📋 Sample Course (Full Data):');
    console.log(JSON.stringify(anyCourse.toObject(), null, 2));
  } else {
    console.log('📋 BPP Accounting and Finance Course (Full Data):\n');
    
    const data = course.toObject();
    
    console.log('🎓 BASIC INFORMATION:');
    console.log(`   University: ${data.universityName}`);
    console.log(`   Course: ${data.courseName}`);
    console.log(`   Code: ${data.courseCode}`);
    console.log(`   Degree Level: ${data.degreeLevel}`);
    console.log(`   Study Mode: ${data.studyMode}`);
    console.log(`   Duration: ${data.durationYears} years`);
    console.log(`   Status: ${data.status}`);
    
    console.log('\n💰 FEES & INTAKES:');
    console.log(`   Local Fee: £${data.tuitionFeeLocal}`);
    console.log(`   International Fee: £${data.tuitionFeeInternational}`);
    console.log(`   Start Date 1: ${data.startDate1 || 'N/A'}`);
    console.log(`   Start Date 2: ${data.startDate2 || 'N/A'}`);
    console.log(`   Deadline: ${data.applicationDeadline || 'N/A'}`);
    console.log(`   Scholarship: ${data.scholarshipAvailable || 'N/A'}`);
    console.log(`   Scholarship Amount: ${data.scholarshipAmount || 'N/A'}`);
    
    console.log('\n📚 ENTRY REQUIREMENTS:');
    console.log(`   Academic: ${data.academicRequirements || 'N/A'}`);
    console.log(`   Min GPA: ${data.minimumGpa || 'N/A'}`);
    console.log(`   IELTS Overall: ${data.ieltsOverall}`);
    console.log(`   IELTS Reading: ${data.ieltsReading}`);
    console.log(`   IELTS Writing: ${data.ieltsWriting}`);
    console.log(`   IELTS Listening: ${data.ieltsListening}`);
    console.log(`   IELTS Speaking: ${data.ieltsSpeaking}`);
    console.log(`   TOEFL: ${data.toeflOverall}`);
    console.log(`   PTE: ${data.pteOverall}`);
    console.log(`   Prerequisites: ${data.prerequisites || 'N/A'}`);
    console.log(`   Work Experience: ${data.workExperience || 'N/A'}`);
    
    console.log('\n🔗 OTHER:');
    console.log(`   URL: ${data.courseUrl || 'N/A'}`);
    console.log(`   Description: ${data.courseDescription ? data.courseDescription.substring(0, 100) + '...' : 'N/A'}`);
  }
  
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('   Data Quality Check');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  // Check how many courses have complete data
  const total = await UniversityCourse.countDocuments();
  const withFees = await UniversityCourse.countDocuments({ tuitionFeeInternational: { $gt: 0 } });
  const withIELTS = await UniversityCourse.countDocuments({ ieltsOverall: { $gt: 0 } });
  const withStartDate = await UniversityCourse.countDocuments({ startDate1: { $ne: '', $exists: true } });
  
  console.log(`✅ Total Courses: ${total}`);
  console.log(`✅ With International Fees: ${withFees} (${((withFees/total)*100).toFixed(1)}%)`);
  console.log(`✅ With IELTS Requirements: ${withIELTS} (${((withIELTS/total)*100).toFixed(1)}%)`);
  console.log(`✅ With Start Dates: ${withStartDate} (${((withStartDate/total)*100).toFixed(1)}%)`);
  
  console.log('\n✅ Data verification complete!\n');
  
  mongoose.connection.close();
};

main();
