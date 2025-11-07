// Test Computer Science search
const mongoose = require('mongoose');
const UniversityCourse = require('./models/UniversityCourse');
require('dotenv').config();

async function testCSSearch() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('🔍 Searching for Computer Science courses...\n');

    // Search for Computer Science courses
    const courses = await UniversityCourse.find({
      status: 'Active',
      $or: [
        { courseName: /computer science/i },
        { courseName: /software engineering/i },
        { courseName: /data science/i }
      ],
      degreeLevel: 'Bachelors',
      studyMode: 'Full-time',
      ieltsOverall: { $lte: 7, $gt: 0 },
      tuitionFeeInternational: { $lte: 35000, $gt: 0 }
    }).limit(10);

    console.log(`✅ Found ${courses.length} Computer Science related courses\n`);
    console.log('═══════════════════════════════════════════════════════════');
    console.log('   COMPUTER SCIENCE COURSES');
    console.log('═══════════════════════════════════════════════════════════\n');

    courses.forEach((course, index) => {
      console.log(`${index + 1}. ${course.courseName}`);
      console.log(`   🏫 ${course.universityName}`);
      console.log(`   💰 Fee: £${course.tuitionFeeInternational}`);
      console.log(`   📊 IELTS: ${course.ieltsOverall} | Duration: ${course.durationYears} years`);
      console.log(`   📅 Start: ${course.startDate1 || 'TBA'}`);
      console.log('');
    });

    mongoose.connection.close();

  } catch (error) {
    console.error('❌ Error:', error.message);
    mongoose.connection.close();
  }
}

testCSSearch();
