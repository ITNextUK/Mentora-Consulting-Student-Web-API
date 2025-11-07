const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api/v1';

// Test data - Student profile
const studentProfile = {
  ieltsScore: 6.5,
  budget: 30000,
  fieldOfInterest: ['Computer Science', 'Software Engineering', 'Data Science'],
  preferredDegreeLevel: 'Bachelors',
  preferredStudyMode: 'Full-time',
  minScore: 40 // Minimum 40% match score
};

console.log('═══════════════════════════════════════════════════════════');
console.log('   Course Ranking API Test');
console.log('═══════════════════════════════════════════════════════════\n');

console.log('📋 Student Profile:');
console.log(`   IELTS Score: ${studentProfile.ieltsScore}`);
console.log(`   Budget: £${studentProfile.budget}`);
console.log(`   Interests: ${studentProfile.fieldOfInterest.join(', ')}`);
console.log(`   Degree Level: ${studentProfile.preferredDegreeLevel}`);
console.log(`   Study Mode: ${studentProfile.preferredStudyMode}`);
console.log(`   Min Match Score: ${studentProfile.minScore}%\n`);

async function testCourseRanking() {
  try {
    console.log('🔍 Fetching ranked courses...\n');
    
    // Note: In production, you'll need to include authentication token
    const response = await axios.post(
      `${API_BASE_URL}/courses/ranked`,
      studentProfile,
      {
        headers: {
          'Content-Type': 'application/json'
          // Add authentication header in production:
          // 'Authorization': `Bearer ${token}`
        }
      }
    );

    const { courses, count, message } = response.data;

    console.log(`✅ ${message}\n`);
    console.log('═══════════════════════════════════════════════════════════');
    console.log('   TOP 10 RECOMMENDED COURSES');
    console.log('═══════════════════════════════════════════════════════════\n');

    // Display top 10 courses
    const top10 = courses.slice(0, 10);

    top10.forEach((course, index) => {
      console.log(`\n🏆 RANK ${course.rank} - Match Score: ${course.matchScore}%`);
      console.log('─────────────────────────────────────────────────────────');
      console.log(`📚 Course: ${course.courseName}`);
      console.log(`🏫 University: ${course.universityName}`);
      console.log(`🎓 Level: ${course.degreeLevel} | Mode: ${course.studyMode}`);
      console.log(`💰 Fee: £${course.tuitionFeeInternational} | Duration: ${course.durationYears} years`);
      console.log(`📊 IELTS Required: ${course.ieltsOverall}`);
      console.log(`📅 Start Date: ${course.startDate1 || 'TBA'}`);
      
      console.log(`\n✨ Why This Matches:`);
      course.matchDetails.reasons.forEach(reason => {
        console.log(`   • ${reason}`);
      });
      
      console.log(`\n📈 Score Breakdown:`);
      console.log(`   • IELTS Match: ${course.matchDetails.ieltsMatch} points`);
      console.log(`   • Budget Match: ${course.matchDetails.budgetMatch} points`);
      console.log(`   • Field Match: ${course.matchDetails.fieldMatch} points`);
      console.log(`   • Degree Level: ${course.matchDetails.degreeLevelMatch} points`);
      console.log(`   • Study Mode: ${course.matchDetails.studyModeMatch} points`);
    });

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log(`   Total Courses Found: ${count}`);
    console.log('═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    if (error.response) {
      console.error('❌ API Error:', error.response.data);
    } else if (error.code === 'ECONNREFUSED') {
      console.error('❌ Server not running. Please start the server with: npm start');
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

async function testOtherEndpoints() {
  try {
    console.log('\n📊 Testing Other Endpoints...\n');

    // Get universities
    const universitiesResponse = await axios.get(`${API_BASE_URL}/courses/meta/universities`);
    console.log(`✅ Universities Available: ${universitiesResponse.data.count}`);
    console.log(`   Top 5: ${universitiesResponse.data.universities.slice(0, 5).join(', ')}\n`);

    // Get degree levels
    const levelsResponse = await axios.get(`${API_BASE_URL}/courses/meta/degree-levels`);
    console.log(`✅ Degree Levels Available: ${levelsResponse.data.count}`);
    console.log(`   Levels: ${levelsResponse.data.degreeLevels.join(', ')}\n`);

    // Get statistics
    const statsResponse = await axios.get(`${API_BASE_URL}/courses/meta/stats`);
    console.log(`✅ Course Statistics:`);
    console.log(`   Total Courses: ${statsResponse.data.stats.totalCourses}`);
    console.log(`   Fee Range: £${Math.round(statsResponse.data.stats.feeRange[0].minFee)} - £${Math.round(statsResponse.data.stats.feeRange[0].maxFee)}`);
    console.log(`   Avg Fee: £${Math.round(statsResponse.data.stats.feeRange[0].avgFee)}`);
    console.log(`   IELTS Range: ${statsResponse.data.stats.ieltsRange[0].minIELTS} - ${statsResponse.data.stats.ieltsRange[0].maxIELTS}`);
    console.log(`   Avg IELTS: ${statsResponse.data.stats.ieltsRange[0].avgIELTS.toFixed(1)}\n`);

  } catch (error) {
    console.error('❌ Error testing endpoints:', error.message);
  }
}

// Run tests
async function runAllTests() {
  await testCourseRanking();
  await testOtherEndpoints();
}

runAllTests();
