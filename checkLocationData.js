const mongoose = require('mongoose');
const UniversityCourse = require('./models/UniversityCourse');
const { connectDB } = require('./config/mongodb');

async function checkLocationData() {
  try {
    await connectDB();
    
    console.log('\n🔍 Checking location data in courses...\n');
    
    // Get sample course
    const sample = await UniversityCourse.findOne();
    console.log('Sample course structure:');
    console.log(JSON.stringify(sample, null, 2));
    
    // Get unique universities
    const universities = await UniversityCourse.distinct('universityName');
    console.log('\n📍 Universities in database:');
    universities.forEach((uni, i) => {
      console.log(`${i + 1}. ${uni}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkLocationData();
