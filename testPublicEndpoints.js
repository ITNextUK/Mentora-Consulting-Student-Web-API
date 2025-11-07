const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api/v1';

console.log('═══════════════════════════════════════════════════════════');
console.log('   Course API - Public Endpoints Test');
console.log('═══════════════════════════════════════════════════════════\n');

async function testPublicEndpoints() {
  try {
    // Test 1: Get Statistics
    console.log('📊 Test 1: Getting Course Statistics...\n');
    const statsResponse = await axios.get(`${API_BASE_URL}/courses/meta/stats`);
    const stats = statsResponse.data.stats;
    
    console.log('✅ Course Statistics:');
    console.log(`   Total Courses: ${stats.totalCourses}`);
    console.log(`   Fee Range: £${Math.round(stats.feeRange[0].minFee)} - £${Math.round(stats.feeRange[0].maxFee)}`);
    console.log(`   Average Fee: £${Math.round(stats.feeRange[0].avgFee)}`);
    console.log(`   IELTS Range: ${stats.ieltsRange[0].minIELTS} - ${stats.ieltsRange[0].maxIELTS}`);
    console.log(`   Average IELTS: ${stats.ieltsRange[0].avgIELTS.toFixed(1)}\n`);

    // Test 2: Get Universities
    console.log('🏫 Test 2: Getting Universities List...\n');
    const universitiesResponse = await axios.get(`${API_BASE_URL}/courses/meta/universities`);
    console.log(`✅ Found ${universitiesResponse.data.count} Universities:`);
    universitiesResponse.data.universities.forEach((uni, index) => {
      console.log(`   ${index + 1}. ${uni}`);
    });
    console.log('');

    // Test 3: Get Degree Levels
    console.log('🎓 Test 3: Getting Degree Levels...\n');
    const levelsResponse = await axios.get(`${API_BASE_URL}/courses/meta/degree-levels`);
    console.log(`✅ Found ${levelsResponse.data.count} Degree Levels:`);
    levelsResponse.data.degreeLevels.forEach((level, index) => {
      const count = stats.byDegreeLevel.find(d => d._id === level)?.count || 0;
      console.log(`   ${index + 1}. ${level} (${count} courses)`);
    });
    console.log('');

    // Test 4: Get Specific Course
    console.log('📚 Test 4: Getting Specific Course...\n');
    const courseResponse = await axios.get(`${API_BASE_URL}/courses/BPP-BSC-AFDB-001`);
    const course = courseResponse.data.course;
    
    console.log('✅ Course Details:');
    console.log(`   Course: ${course.courseName}`);
    console.log(`   University: ${course.universityName}`);
    console.log(`   Level: ${course.degreeLevel}`);
    console.log(`   Duration: ${course.durationYears} years`);
    console.log(`   Fee: £${course.tuitionFeeInternational}`);
    console.log(`   IELTS: ${course.ieltsOverall} overall`);
    console.log(`   Start Date: ${course.startDate1}`);
    console.log(`   Deadline: ${course.applicationDeadline}`);
    console.log(`   Scholarship: ${course.scholarshipAvailable}\n`);

    console.log('═══════════════════════════════════════════════════════════');
    console.log('   ✅ All Public Endpoints Working!');
    console.log('═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    if (error.response) {
      console.error('❌ API Error:', error.response.status, error.response.data);
    } else if (error.code === 'ECONNREFUSED') {
      console.error('❌ Server not running!');
      console.error('   Please start the server with: npm start');
      console.error('   Or: node server.js\n');
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

testPublicEndpoints();
