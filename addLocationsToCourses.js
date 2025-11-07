const mongoose = require('mongoose');
const UniversityCourse = require('./models/UniversityCourse');
const { connectDB } = require('./config/mongodb');
const { getUniversityLocation } = require('./utils/universityLocations');

async function addLocationsToCourses() {
  try {
    await connectDB();
    
    console.log('\n🌍 Adding location data to courses...\n');
    
    // Get all courses
    const courses = await UniversityCourse.find({});
    console.log(`Found ${courses.length} courses to update`);
    
    let updated = 0;
    let skipped = 0;
    
    for (const course of courses) {
      // Get location for this university
      const location = getUniversityLocation(course.universityName);
      
      // Update course with location
      course.city = location.city;
      course.region = location.region;
      course.country = location.country;
      
      await course.save();
      updated++;
      
      if (updated % 100 === 0) {
        console.log(`Updated ${updated}/${courses.length} courses...`);
      }
    }
    
    console.log(`\n✅ Successfully updated ${updated} courses with location data`);
    console.log(`⏭️  Skipped ${skipped} courses`);
    
    // Show sample
    const sample = await UniversityCourse.findOne({ universityName: 'BPP University' });
    console.log('\n📋 Sample updated course:');
    console.log(`${sample.courseName} - ${sample.universityName}`);
    console.log(`Location: ${sample.city}, ${sample.region}, ${sample.country}`);
    
    // Show location statistics
    const locationStats = await UniversityCourse.aggregate([
      {
        $group: {
          _id: '$city',
          count: { $sum: 1 },
          universities: { $addToSet: '$universityName' }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    console.log('\n📊 Courses by City:');
    locationStats.forEach(stat => {
      console.log(`${stat._id}: ${stat.count} courses (${stat.universities.join(', ')})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addLocationsToCourses();
