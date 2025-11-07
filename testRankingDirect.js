// Direct test without starting/stopping server
const mongoose = require('mongoose');
const UniversityCourse = require('./models/UniversityCourse');
require('dotenv').config();

async function testRanking() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Sample student profile
    const studentProfile = {
      ieltsScore: 6.5,
      budget: 30000,
      fieldOfInterest: ['Computer Science', 'Software'],
      preferredDegreeLevel: 'Bachelors',
      preferredStudyMode: 'Full-time'
    };

    console.log('📋 Student Profile:');
    console.log(`   IELTS: ${studentProfile.ieltsScore}`);
    console.log(`   Budget: £${studentProfile.budget}`);
    console.log(`   Interests: ${studentProfile.fieldOfInterest.join(', ')}`);
    console.log(`   Degree: ${studentProfile.preferredDegreeLevel}\n`);

    // Build query
    const query = {
      status: 'Active',
      degreeLevel: new RegExp(studentProfile.preferredDegreeLevel, 'i'),
      studyMode: new RegExp(studentProfile.preferredStudyMode, 'i'),
      ieltsOverall: { $lte: studentProfile.ieltsScore + 0.5 },
      tuitionFeeInternational: { $lte: studentProfile.budget * 1.15, $gt: 0 }
    };

    console.log('🔍 Searching courses...\n');
    const courses = await UniversityCourse.find(query).limit(50);

    console.log(`✅ Found ${courses.length} matching courses\n`);

    if (courses.length > 0) {
      // Calculate scores for top 5
      const scored = courses.map(course => {
        let score = 0;
        const reasons = [];

        // IELTS match
        if (course.ieltsOverall) {
          const diff = studentProfile.ieltsScore - course.ieltsOverall;
          if (diff >= 1.0) {
            score += 30;
            reasons.push('IELTS well above requirement');
          } else if (diff >= 0.5) {
            score += 25;
            reasons.push('IELTS above requirement');
          } else if (diff >= 0) {
            score += 20;
            reasons.push('IELTS meets requirement');
          }
        }

        // Budget match
        if (course.tuitionFeeInternational && course.tuitionFeeInternational <= studentProfile.budget) {
          const savings = studentProfile.budget - course.tuitionFeeInternational;
          const savingsPercent = (savings / studentProfile.budget) * 100;
          if (savingsPercent >= 20) {
            score += 25;
            reasons.push('Well within budget');
          } else if (savingsPercent >= 10) {
            score += 20;
            reasons.push('Within budget');
          } else {
            score += 15;
            reasons.push('Fits budget');
          }
        }

        // Field match
        const courseName = course.courseName.toLowerCase();
        studentProfile.fieldOfInterest.forEach(interest => {
          if (courseName.includes(interest.toLowerCase())) {
            score += 15;
            reasons.push(`Matches ${interest}`);
          }
        });

        return {
          course,
          score,
          reasons
        };
      });

      // Sort by score
      scored.sort((a, b) => b.score - a.score);

      // Display top 5
      console.log('═══════════════════════════════════════════════════════════');
      console.log('   TOP 5 RECOMMENDED COURSES');
      console.log('═══════════════════════════════════════════════════════════\n');

      scored.slice(0, 5).forEach((item, index) => {
        const c = item.course;
        console.log(`🏆 ${index + 1}. Match Score: ${item.score}%`);
        console.log(`   ${c.courseName}`);
        console.log(`   ${c.universityName}`);
        console.log(`   Fee: £${c.tuitionFeeInternational} | IELTS: ${c.ieltsOverall}`);
        console.log(`   ✨ ${item.reasons.join(', ')}\n`);
      });

      console.log('═══════════════════════════════════════════════════════════\n');
    }

    mongoose.connection.close();
    console.log('✅ Test completed successfully!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    mongoose.connection.close();
  }
}

testRanking();
