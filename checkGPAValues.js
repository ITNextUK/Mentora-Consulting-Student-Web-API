const mongoose = require('mongoose');
require('dotenv').config();

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mentora-student-db';

mongoose.connect(mongoURI)
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB connection error:', err));

const UniversityCourse = require('./models/UniversityCourse');

async function checkGPAValues() {
  try {
    console.log('\n🔍 Checking GPA values in database...\n');
    
    // Get distinct GPA values
    const gpaValues = await UniversityCourse.distinct('minimumGpa');
    
    console.log('📊 Unique GPA values found:');
    gpaValues.slice(0, 20).forEach(gpa => {
      console.log(`   - "${gpa}"`);
    });
    
    console.log(`\n   Total unique values: ${gpaValues.length}`);
    
    // Check some sample courses
    const sampleCourses = await UniversityCourse.find({ minimumGpa: { $exists: true, $ne: null } }).limit(10);
    
    console.log('\n📝 Sample courses with GPA requirements:');
    sampleCourses.forEach(course => {
      console.log(`   - ${course.courseName}`);
      console.log(`     GPA: "${course.minimumGpa}"`);
      console.log(`     Degree: ${course.degreeLevel}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkGPAValues();
