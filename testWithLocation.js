const mongoose = require('mongoose');
const UniversityCourse = require('./models/UniversityCourse');
const { connectDB } = require('./config/mongodb');

/**
 * Calculate match score for a course based on student qualifications
 * Returns a score between 0-100
 */
const calculateMatchScore = (course, studentProfile) => {
  let score = 0;
  let maxScore = 0;
  const details = {
    ieltsMatch: 0,
    budgetMatch: 0,
    fieldMatch: 0,
    degreeLevelMatch: 0,
    studyModeMatch: 0,
    locationMatch: 0,
    totalScore: 0,
    reasons: []
  };

  // 1. IELTS Score Match (Weight: 25 points)
  maxScore += 25;
  if (studentProfile.ieltsScore && course.ieltsOverall) {
    const studentIELTS = parseFloat(studentProfile.ieltsScore);
    const requiredIELTS = parseFloat(course.ieltsOverall);
    
    if (studentIELTS >= requiredIELTS) {
      const excess = studentIELTS - requiredIELTS;
      if (excess >= 1.0) {
        score += 25;
        details.ieltsMatch = 25;
        details.reasons.push(`✅ IELTS ${studentIELTS} well above requirement of ${requiredIELTS}`);
      } else if (excess >= 0.5) {
        score += 20;
        details.ieltsMatch = 20;
        details.reasons.push(`✅ IELTS ${studentIELTS} above requirement of ${requiredIELTS}`);
      } else {
        score += 15;
        details.ieltsMatch = 15;
        details.reasons.push(`✅ IELTS ${studentIELTS} meets requirement of ${requiredIELTS}`);
      }
    }
  }

  // 2. Budget Match (Weight: 20 points)
  maxScore += 20;
  if (studentProfile.budget && course.tuitionFeeInternational) {
    const budget = parseFloat(studentProfile.budget);
    const fee = parseFloat(course.tuitionFeeInternational);
    
    if (fee <= budget) {
      const savings = budget - fee;
      const savingsPercent = Math.round((savings / budget) * 100);
      
      if (savingsPercent >= 20) {
        score += 20;
        details.budgetMatch = 20;
        details.reasons.push(`💰 Fee £${fee.toLocaleString()} well within budget (${savingsPercent}% savings)`);
      } else if (savingsPercent >= 10) {
        score += 16;
        details.budgetMatch = 16;
        details.reasons.push(`💰 Fee £${fee.toLocaleString()} within budget`);
      } else {
        score += 12;
        details.budgetMatch = 12;
        details.reasons.push(`💰 Fee £${fee.toLocaleString()} fits budget`);
      }
    }
  }

  // 3. Field of Interest Match (Weight: 25 points)
  maxScore += 25;
  if (studentProfile.fieldOfInterest && course.courseName) {
    const interests = Array.isArray(studentProfile.fieldOfInterest) 
      ? studentProfile.fieldOfInterest 
      : [studentProfile.fieldOfInterest];
    
    const courseName = course.courseName.toLowerCase();
    
    let matchCount = 0;
    let matchedFields = [];
    
    interests.forEach(interest => {
      const interestLower = interest.toLowerCase();
      if (courseName.includes(interestLower)) {
        matchCount++;
        matchedFields.push(interest);
      }
    });
    
    if (matchCount > 0) {
      const matchScore = Math.min(25, matchCount * 15);
      score += matchScore;
      details.fieldMatch = matchScore;
      details.reasons.push(`🎯 Matches interest: ${matchedFields.join(', ')}`);
    }
  }

  // 4. Degree Level Match (Weight: 10 points)
  maxScore += 10;
  if (studentProfile.preferredDegreeLevel && course.degreeLevel) {
    if (studentProfile.preferredDegreeLevel.toLowerCase() === course.degreeLevel.toLowerCase()) {
      score += 10;
      details.degreeLevelMatch = 10;
      details.reasons.push(`🎓 Matches degree level: ${course.degreeLevel}`);
    }
  }

  // 5. Study Mode Match (Weight: 10 points)
  maxScore += 10;
  if (studentProfile.preferredStudyMode && course.studyMode) {
    if (studentProfile.preferredStudyMode.toLowerCase() === course.studyMode.toLowerCase()) {
      score += 10;
      details.studyModeMatch = 10;
      details.reasons.push(`⏰ Matches study mode: ${course.studyMode}`);
    }
  }

  // 6. Location Preference Match (Weight: 20 points)
  maxScore += 20;
  if (studentProfile.preferredLocations && course.city) {
    const preferredLocs = Array.isArray(studentProfile.preferredLocations) 
      ? studentProfile.preferredLocations 
      : [studentProfile.preferredLocations];
    
    const courseCity = course.city.toLowerCase();
    const courseRegion = (course.region || '').toLowerCase();
    
    let locationMatchScore = 0;
    let matchedLocation = null;
    
    preferredLocs.forEach(location => {
      const locLower = location.toLowerCase();
      if (courseCity.includes(locLower) || locLower.includes(courseCity)) {
        locationMatchScore = Math.max(locationMatchScore, 20);
        matchedLocation = course.city;
      } else if (courseRegion.includes(locLower) || locLower.includes(courseRegion)) {
        locationMatchScore = Math.max(locationMatchScore, 12);
        matchedLocation = course.region;
      }
    });
    
    if (locationMatchScore > 0) {
      score += locationMatchScore;
      details.locationMatch = locationMatchScore;
      details.reasons.push(`📍 Located in ${matchedLocation}`);
    }
  }

  const finalScore = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  details.totalScore = finalScore;

  return {
    score: finalScore,
    details
  };
};

async function testWithLocation() {
  try {
    await connectDB();
    
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║                                                           ║');
    console.log('║   COURSE RANKING WITH LOCATION PREFERENCES - TEST         ║');
    console.log('║                                                           ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    // ============= TEST CASE 1: London-Based Computer Science Student =============
    console.log('📋 TEST CASE 1: Computer Science Student Preferring London');
    console.log('─────────────────────────────────────────────────────────\n');
    
    const studentProfile1 = {
      ieltsScore: 7.0,
      budget: 30000,
      fieldOfInterest: ['Computer Science', 'Software Engineering', 'Data Science'],
      preferredDegreeLevel: 'Bachelors',
      preferredStudyMode: 'Full-time',
      preferredLocations: ['London']
    };

    console.log('Student Profile:');
    console.log(`  IELTS: ${studentProfile1.ieltsScore}`);
    console.log(`  Budget: £${studentProfile1.budget.toLocaleString()}`);
    console.log(`  Interests: ${studentProfile1.fieldOfInterest.join(', ')}`);
    console.log(`  Degree: ${studentProfile1.preferredDegreeLevel}`);
    console.log(`  Mode: ${studentProfile1.preferredStudyMode}`);
    console.log(`  Preferred Location: ${studentProfile1.preferredLocations.join(', ')}`);

    const query1 = {
      status: 'Active',
      degreeLevel: 'Bachelors',
      studyMode: 'Full-time',
      ieltsOverall: { $lte: 7.5 },
      tuitionFeeInternational: { $lte: 34500, $gt: 0 },
      $or: [
        { courseName: /Computer Science/i },
        { courseName: /Software Engineering/i },
        { courseName: /Data Science/i }
      ]
    };

    const courses1 = await UniversityCourse.find(query1);
    console.log(`\n✅ Found ${courses1.length} matching courses\n`);

    const rankedCourses1 = courses1
      .map(course => {
        const result = calculateMatchScore(course.toObject(), studentProfile1);
        return {
          course,
          matchScore: result.score,
          details: result.details
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 5);

    console.log('🏆 TOP 5 RECOMMENDATIONS:\n');
    rankedCourses1.forEach((item, index) => {
      const { course, matchScore, details } = item;
      console.log(`${index + 1}. Match Score: ${matchScore}% - ${course.courseName}`);
      console.log(`   ${course.universityName}`);
      console.log(`   Fee: £${course.tuitionFeeInternational?.toLocaleString()} | IELTS: ${course.ieltsOverall} | ${course.durationYears} years`);
      console.log(`   📍 Location: ${course.city}, ${course.region}`);
      console.log(`   Reasons:`);
      details.reasons.forEach(reason => console.log(`     • ${reason}`));
      console.log('');
    });

    // ============= TEST CASE 2: Business Student Preferring Newcastle =============
    console.log('\n📋 TEST CASE 2: Business Student Preferring Newcastle');
    console.log('─────────────────────────────────────────────────────────\n');
    
    const studentProfile2 = {
      ieltsScore: 6.5,
      budget: 22000,
      fieldOfInterest: ['Business', 'Management'],
      preferredDegreeLevel: 'Bachelors',
      preferredStudyMode: 'Full-time',
      preferredLocations: ['Newcastle', 'North East England']
    };

    console.log('Student Profile:');
    console.log(`  IELTS: ${studentProfile2.ieltsScore}`);
    console.log(`  Budget: £${studentProfile2.budget.toLocaleString()}`);
    console.log(`  Interests: ${studentProfile2.fieldOfInterest.join(', ')}`);
    console.log(`  Degree: ${studentProfile2.preferredDegreeLevel}`);
    console.log(`  Mode: ${studentProfile2.preferredStudyMode}`);
    console.log(`  Preferred Locations: ${studentProfile2.preferredLocations.join(', ')}`);

    const query2 = {
      status: 'Active',
      degreeLevel: 'Bachelors',
      studyMode: 'Full-time',
      ieltsOverall: { $lte: 7.0 },
      tuitionFeeInternational: { $lte: 25300, $gt: 0 },
      $or: [
        { courseName: /Business/i },
        { courseName: /Management/i }
      ]
    };

    const courses2 = await UniversityCourse.find(query2);
    console.log(`\n✅ Found ${courses2.length} matching courses\n`);

    const rankedCourses2 = courses2
      .map(course => {
        const result = calculateMatchScore(course.toObject(), studentProfile2);
        return {
          course,
          matchScore: result.score,
          details: result.details
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 5);

    console.log('🏆 TOP 5 RECOMMENDATIONS:\n');
    rankedCourses2.forEach((item, index) => {
      const { course, matchScore, details } = item;
      console.log(`${index + 1}. Match Score: ${matchScore}% - ${course.courseName}`);
      console.log(`   ${course.universityName}`);
      console.log(`   Fee: £${course.tuitionFeeInternational?.toLocaleString()} | IELTS: ${course.ieltsOverall}`);
      console.log(`   📍 Location: ${course.city}, ${course.region}`);
      console.log(`   Reasons:`);
      details.reasons.forEach(reason => console.log(`     • ${reason}`));
      console.log('');
    });

    // ============= LOCATION STATISTICS =============
    console.log('\n📊 LOCATION STATISTICS:');
    console.log('─────────────────────────────────────────────────────────\n');

    const locationStats = await UniversityCourse.aggregate([
      {
        $group: {
          _id: '$city',
          count: { $sum: 1 },
          region: { $first: '$region' },
          universities: { $addToSet: '$universityName' },
          avgFee: { $avg: '$tuitionFeeInternational' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    console.log('Courses by City:\n');
    locationStats.forEach(stat => {
      console.log(`📍 ${stat._id} (${stat.region})`);
      console.log(`   ${stat.count} courses | Avg Fee: £${Math.round(stat.avgFee).toLocaleString()}`);
      console.log(`   Universities: ${stat.universities.join(', ')}`);
      console.log('');
    });

    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║                                                           ║');
    console.log('║         ✅ LOCATION-BASED RANKING COMPLETED!              ║');
    console.log('║                                                           ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testWithLocation();
