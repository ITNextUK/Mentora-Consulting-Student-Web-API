const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mentora-student-db';

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Import models
const UniversityCourse = require('./models/UniversityCourse');
const Student = require('./models/StudentMongo');

// Test students
const testEmails = [
  'alice.test@example.com',
  'bob.test@example.com',
  'charlie.test@example.com',
  'diana.test@example.com',
  'eva.test@example.com'
];

// Check entry requirements function (copied from controller)
const checkEntryRequirements = (course, studentProfile) => {
  const result = {
    eligible: true,
    failedRequirements: [],
    warnings: [],
    details: {}
  };

  // 1. Check IELTS Requirements
  if (course.ieltsOverall && studentProfile.ieltsScore) {
    const studentIELTS = parseFloat(studentProfile.ieltsScore);
    const requiredIELTS = parseFloat(course.ieltsOverall);
    
    result.details.ieltsCheck = {
      studentScore: studentIELTS,
      required: requiredIELTS,
      met: studentIELTS >= requiredIELTS
    };
    
    if (studentIELTS < requiredIELTS) {
      result.eligible = false;
      result.failedRequirements.push(`IELTS: Need ${requiredIELTS}, have ${studentIELTS}`);
    }
  }

  // 2. Check GPA Requirements
  if (course.minimumGpa && studentProfile.gpa) {
    const courseGPA = course.minimumGpa.toLowerCase();
    const studentGPA = parseFloat(studentProfile.gpa);
    
    let requiredGPA = 0;
    if (courseGPA.includes('2.2/4') || courseGPA.includes('2:2')) {
      requiredGPA = 2.2;
    } else if (courseGPA.includes('2.1/4') || courseGPA.includes('2:1')) {
      requiredGPA = 2.5;
    } else if (courseGPA.includes('1st') || courseGPA.includes('first')) {
      requiredGPA = 3.5;
    } else {
      const gpaMatch = courseGPA.match(/(\d+\.?\d*)/);
      if (gpaMatch) requiredGPA = parseFloat(gpaMatch[1]);
    }
    
    if (requiredGPA > 0) {
      result.details.gpaCheck = {
        studentGPA: studentGPA,
        required: requiredGPA,
        met: studentGPA >= requiredGPA
      };
      
      if (studentGPA < requiredGPA) {
        result.eligible = false;
        result.failedRequirements.push(`GPA: Need ${requiredGPA}, have ${studentGPA}`);
      }
    }
  }

  // 3. Check Academic Requirements
  if (course.academicRequirements && studentProfile.education) {
    const requirements = course.academicRequirements.toLowerCase();
    const hasEducation = Array.isArray(studentProfile.education) && studentProfile.education.length > 0;
    
    if (requirements.includes("bachelor") && hasEducation) {
      const hasBachelors = studentProfile.education.some(edu => 
        edu && edu.degree && typeof edu.degree === 'string' && (
          edu.degree.toLowerCase().includes('bachelor') ||
          edu.degree.toLowerCase().includes('bsc') ||
          edu.degree.toLowerCase().includes('ba') ||
          edu.degree.toLowerCase().includes('beng')
        )
      );
      
      if (!hasBachelors && course.degreeLevel && course.degreeLevel.toLowerCase().includes('master')) {
        result.eligible = false;
        result.failedRequirements.push("Bachelor's degree required for Master's programs");
      }
    }
  }

  return result;
};

async function testEntryRequirementsFiltering() {
  try {
    console.log('\n🧪 Testing Entry Requirements Filtering\n');
    console.log('='.repeat(80));
    
    for (const email of testEmails) {
      const student = await Student.findOne({ email });
      if (!student) {
        console.log(`❌ Student not found: ${email}`);
        continue;
      }
      
      console.log(`\n👤 Testing: ${student.firstName} ${student.lastName}`);
      console.log('-'.repeat(80));
      console.log(`📧 Email: ${email}`);
      console.log(`📝 IELTS: ${student.englishProficiency.scores.overall}`);
      console.log(`📊 GPA: ${student.gpa}`);
      console.log(`🎓 Education: ${student.education.map(e => e.degree).join(', ')}`);
      console.log(`💼 Work Experience: ${student.workExperience.length} position(s)`);
      
      // Build student profile
      const studentProfile = {
        ieltsScore: student.englishProficiency.scores.overall,
        gpa: parseFloat(student.gpa),
        education: student.education,
        workExperience: student.workExperience
      };
      
      // Get sample of courses with different requirements
      const courses = await UniversityCourse.find({ status: 'Active' }).limit(100);
      
      let eligible = 0;
      let ineligible = 0;
      const ineligibleReasons = {};
      
      courses.forEach(course => {
        const check = checkEntryRequirements(course, studentProfile);
        
        if (check.eligible) {
          eligible++;
        } else {
          ineligible++;
          check.failedRequirements.forEach(reason => {
            ineligibleReasons[reason] = (ineligibleReasons[reason] || 0) + 1;
          });
        }
      });
      
      console.log(`\n📈 Results (out of ${courses.length} courses tested):`);
      console.log(`   ✅ Eligible: ${eligible} courses (${(eligible/courses.length*100).toFixed(1)}%)`);
      console.log(`   ❌ Ineligible: ${ineligible} courses (${(ineligible/courses.length*100).toFixed(1)}%)`);
      
      if (ineligible > 0) {
        console.log(`\n   Top reasons for ineligibility:`);
        const sortedReasons = Object.entries(ineligibleReasons)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3);
        sortedReasons.forEach(([reason, count]) => {
          console.log(`   - ${reason}: ${count} courses`);
        });
      }
      
      console.log('');
    }
    
    console.log('='.repeat(80));
    console.log('\n✅ Entry requirements filtering test completed!\n');
    
  } catch (error) {
    console.error('❌ Error testing entry requirements:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔒 Database connection closed\n');
  }
}

// Run the test
testEntryRequirementsFiltering();
