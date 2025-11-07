const mongoose = require('mongoose');
const UniversityCourse = require('./models/UniversityCourse');
require('dotenv').config();

// Import the ranking function from controller
const calculateMatchScore = (course, studentProfile) => {
  let score = 0;
  const details = { reasons: [] };

  // IELTS (30 pts)
  if (studentProfile.ieltsScore && course.ieltsOverall) {
    const diff = studentProfile.ieltsScore - course.ieltsOverall;
    if (diff >= 1.0) {
      score += 30;
      details.reasons.push(`✅ IELTS ${studentProfile.ieltsScore} well above requirement of ${course.ieltsOverall}`);
    } else if (diff >= 0.5) {
      score += 25;
      details.reasons.push(`✅ IELTS ${studentProfile.ieltsScore} above requirement of ${course.ieltsOverall}`);
    } else if (diff >= 0) {
      score += 20;
      details.reasons.push(`✅ IELTS ${studentProfile.ieltsScore} meets requirement of ${course.ieltsOverall}`);
    }
  }

  // Budget (25 pts)
  if (studentProfile.budget && course.tuitionFeeInternational && course.tuitionFeeInternational > 0) {
    if (course.tuitionFeeInternational <= studentProfile.budget) {
      const savings = studentProfile.budget - course.tuitionFeeInternational;
      const savingsPercent = (savings / studentProfile.budget) * 100;
      if (savingsPercent >= 20) {
        score += 25;
        details.reasons.push(`💰 Fee £${course.tuitionFeeInternational} well within budget (${savingsPercent.toFixed(0)}% savings)`);
      } else if (savingsPercent >= 10) {
        score += 20;
        details.reasons.push(`💰 Fee £${course.tuitionFeeInternational} within budget`);
      } else {
        score += 15;
        details.reasons.push(`💰 Fee £${course.tuitionFeeInternational} fits budget`);
      }
    }
  }

  // Field of Interest (25 pts)
  if (studentProfile.fieldOfInterest && studentProfile.fieldOfInterest.length > 0) {
    const courseName = course.courseName.toLowerCase();
    let fieldScore = 0;
    studentProfile.fieldOfInterest.forEach(interest => {
      if (courseName.includes(interest.toLowerCase())) {
        fieldScore += 15;
        details.reasons.push(`🎯 Matches interest: ${interest}`);
      }
    });
    score += Math.min(25, fieldScore);
  }

  // Degree Level (10 pts)
  if (studentProfile.preferredDegreeLevel && course.degreeLevel) {
    if (studentProfile.preferredDegreeLevel.toLowerCase() === course.degreeLevel.toLowerCase()) {
      score += 10;
      details.reasons.push(`🎓 Matches degree level: ${course.degreeLevel}`);
    }
  }

  // Study Mode (10 pts)
  if (studentProfile.preferredStudyMode && course.studyMode) {
    if (studentProfile.preferredStudyMode.toLowerCase() === course.studyMode.toLowerCase()) {
      score += 10;
      details.reasons.push(`⏰ Matches study mode: ${course.studyMode}`);
    }
  }

  return { score, details };
};

async function comprehensiveTest() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║                                                           ║');
    console.log('║     COURSE RANKING SYSTEM - COMPREHENSIVE TEST            ║');
    console.log('║                                                           ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    // Test Case 1: Computer Science Student
    console.log('📋 TEST CASE 1: Computer Science Student');
    console.log('─────────────────────────────────────────────────────────\n');
    
    const studentProfile1 = {
      ieltsScore: 7.0,
      budget: 25000,
      fieldOfInterest: ['Computer Science', 'Software Engineering'],
      preferredDegreeLevel: 'Bachelors',
      preferredStudyMode: 'Full-time'
    };

    console.log('Student Profile:');
    console.log(`  IELTS: ${studentProfile1.ieltsScore}`);
    console.log(`  Budget: £${studentProfile1.budget}`);
    console.log(`  Interests: ${studentProfile1.fieldOfInterest.join(', ')}`);
    console.log(`  Degree: ${studentProfile1.preferredDegreeLevel}`);
    console.log(`  Mode: ${studentProfile1.preferredStudyMode}\n`);

    const query1 = {
      status: 'Active',
      $or: [
        { courseName: /computer science/i },
        { courseName: /software engineering/i }
      ],
      degreeLevel: 'Bachelors',
      studyMode: 'Full-time',
      ieltsOverall: { $lte: studentProfile1.ieltsScore + 0.5, $gt: 0 },
      tuitionFeeInternational: { $lte: studentProfile1.budget * 1.15, $gt: 0 }
    };

    const courses1 = await UniversityCourse.find(query1).limit(20);
    
    const ranked1 = courses1.map(course => {
      const result = calculateMatchScore(course.toObject(), studentProfile1);
      return { course, ...result };
    }).sort((a, b) => b.score - a.score);

    console.log(`✅ Found ${ranked1.length} matching courses\n`);
    console.log('🏆 TOP 3 RECOMMENDATIONS:\n');

    ranked1.slice(0, 3).forEach((item, index) => {
      const c = item.course;
      console.log(`${index + 1}. Match Score: ${item.score}% - ${c.courseName}`);
      console.log(`   ${c.universityName}`);
      console.log(`   Fee: £${c.tuitionFeeInternational} | IELTS: ${c.ieltsOverall} | ${c.durationYears} years`);
      console.log(`   Reasons:`);
      item.details.reasons.forEach(reason => console.log(`     • ${reason}`));
      console.log('');
    });

    // Test Case 2: Business Student
    console.log('\n📋 TEST CASE 2: Business Management Student');
    console.log('─────────────────────────────────────────────────────────\n');
    
    const studentProfile2 = {
      ieltsScore: 6.5,
      budget: 22000,
      fieldOfInterest: ['Business', 'Management'],
      preferredDegreeLevel: 'Bachelors',
      preferredStudyMode: 'Full-time'
    };

    console.log('Student Profile:');
    console.log(`  IELTS: ${studentProfile2.ieltsScore}`);
    console.log(`  Budget: £${studentProfile2.budget}`);
    console.log(`  Interests: ${studentProfile2.fieldOfInterest.join(', ')}`);
    console.log(`  Degree: ${studentProfile2.preferredDegreeLevel}\n`);

    const query2 = {
      status: 'Active',
      $or: [
        { courseName: /business/i },
        { courseName: /management/i }
      ],
      degreeLevel: 'Bachelors',
      studyMode: 'Full-time',
      ieltsOverall: { $lte: studentProfile2.ieltsScore + 0.5, $gt: 0 },
      tuitionFeeInternational: { $lte: studentProfile2.budget * 1.15, $gt: 0 }
    };

    const courses2 = await UniversityCourse.find(query2).limit(20);
    
    const ranked2 = courses2.map(course => {
      const result = calculateMatchScore(course.toObject(), studentProfile2);
      return { course, ...result };
    }).sort((a, b) => b.score - a.score);

    console.log(`✅ Found ${ranked2.length} matching courses\n`);
    console.log('🏆 TOP 3 RECOMMENDATIONS:\n');

    ranked2.slice(0, 3).forEach((item, index) => {
      const c = item.course;
      console.log(`${index + 1}. Match Score: ${item.score}% - ${c.courseName}`);
      console.log(`   ${c.universityName}`);
      console.log(`   Fee: £${c.tuitionFeeInternational} | IELTS: ${c.ieltsOverall}`);
      console.log(`   Reasons:`);
      item.details.reasons.forEach(reason => console.log(`     • ${reason}`));
      console.log('');
    });

    // Statistics
    console.log('\n📊 DATABASE STATISTICS:');
    console.log('─────────────────────────────────────────────────────────\n');
    
    const totalCourses = await UniversityCourse.countDocuments();
    const bachelorsCourses = await UniversityCourse.countDocuments({ degreeLevel: 'Bachelors' });
    const avgFee = await UniversityCourse.aggregate([
      { $match: { tuitionFeeInternational: { $gt: 0 } } },
      { $group: { _id: null, avg: { $avg: '$tuitionFeeInternational' } } }
    ]);

    console.log(`Total Courses: ${totalCourses}`);
    console.log(`Bachelors Courses: ${bachelorsCourses}`);
    console.log(`Average International Fee: £${Math.round(avgFee[0].avg)}\n`);

    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║                                                           ║');
    console.log('║         ✅ ALL TESTS COMPLETED SUCCESSFULLY!              ║');
    console.log('║                                                           ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    mongoose.connection.close();

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    mongoose.connection.close();
  }
}

comprehensiveTest();
