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
  console.log('   University Courses Database Verification');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  // Total courses
  const total = await UniversityCourse.countDocuments();
  console.log(`📊 Total Courses: ${total}\n`);
  
  // Count by university
  console.log('🏫 Courses by University:');
  const byUniversity = await UniversityCourse.aggregate([
    { $group: { _id: '$universityName', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  byUniversity.forEach(uni => {
    console.log(`   ${uni._id}: ${uni.count} courses`);
  });
  
  // Count by degree level
  console.log('\n🎓 Courses by Degree Level:');
  const byDegree = await UniversityCourse.aggregate([
    { $group: { _id: '$degreeLevel', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  byDegree.forEach(degree => {
    console.log(`   ${degree._id}: ${degree.count} courses`);
  });
  
  // Sample course
  console.log('\n📋 Sample Course:');
  const sample = await UniversityCourse.findOne();
  console.log(JSON.stringify({
    universityName: sample.universityName,
    courseName: sample.courseName,
    degreeLevel: sample.degreeLevel,
    studyMode: sample.studyMode,
    durationYears: sample.durationYears,
    tuitionFeeInternational: sample.tuitionFeeInternational,
    ieltsOverall: sample.ieltsOverall
  }, null, 2));
  
  console.log('\n✅ Database verification complete!\n');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  mongoose.connection.close();
};

main();
