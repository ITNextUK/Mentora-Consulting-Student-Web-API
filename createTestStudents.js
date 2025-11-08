const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// MongoDB connection
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mentora-student-db';

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Student Schema (simplified for test data)
const StudentSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: { type: String, unique: true },
  password: String,
  phoneNumber: String,
  dateOfBirth: Date,
  nationality: String,
  
  // English Proficiency
  englishProficiency: {
    testType: String,
    scores: {
      overall: Number,
      listening: Number,
      reading: Number,
      writing: Number,
      speaking: Number
    },
    testDate: Date
  },
  
  // Education
  education: [{
    degree: String,
    institution: String,
    fieldOfStudy: String,
    graduationYear: String,
    gpa: String
  }],
  
  // Work Experience
  workExperience: [{
    company: String,
    position: String,
    startDate: Date,
    endDate: Date,
    isCurrentlyWorking: Boolean,
    description: String
  }],
  
  // GPA
  gpa: String,
  
  // Preferences
  coursesOfInterest: [{
    courseName: String,
    level: String
  }],
  locationInterests: [String]
}, { timestamps: true });

const Student = mongoose.model('Student', StudentSchema);

// Test Students with Different Profiles
const testStudents = [
  {
    // STUDENT 1: High Achiever - Should qualify for most courses
    firstName: 'Alice',
    lastName: 'Johnson',
    email: 'alice.test@example.com',
    password: 'Test123!',
    phoneNumber: '+44 7700 900001',
    dateOfBirth: new Date('1998-05-15'),
    nationality: 'British',
    englishProficiency: {
      testType: 'IELTS',
      scores: {
        overall: 7.5,
        listening: 7.5,
        reading: 8.0,
        writing: 7.0,
        speaking: 7.5
      },
      testDate: new Date('2024-06-15')
    },
    education: [
      {
        degree: "Bachelor of Science in Computer Science",
        institution: "University of Manchester",
        fieldOfStudy: "Computer Science",
        graduationYear: "2020",
        gpa: "3.7"
      }
    ],
    workExperience: [
      {
        company: "Tech Corp Ltd",
        position: "Software Developer",
        startDate: new Date('2020-09-01'),
        endDate: new Date('2024-08-31'),
        isCurrentlyWorking: false,
        description: "Full-stack development"
      }
    ],
    gpa: "3.7",
    coursesOfInterest: [
      { courseName: "MSc Computer Science", level: "Master's" }
    ],
    locationInterests: ["London", "Manchester"]
  },
  
  {
    // STUDENT 2: Low IELTS - Should filter out high IELTS requirement courses
    firstName: 'Bob',
    lastName: 'Smith',
    email: 'bob.test@example.com',
    password: 'Test123!',
    phoneNumber: '+44 7700 900002',
    dateOfBirth: new Date('1999-08-20'),
    nationality: 'Indian',
    englishProficiency: {
      testType: 'IELTS',
      scores: {
        overall: 6.0,
        listening: 6.0,
        reading: 6.5,
        writing: 5.5,
        speaking: 6.0
      },
      testDate: new Date('2024-07-10')
    },
    education: [
      {
        degree: "Bachelor of Technology in Information Technology",
        institution: "Delhi University",
        fieldOfStudy: "Information Technology",
        graduationYear: "2021",
        gpa: "3.2"
      }
    ],
    workExperience: [
      {
        company: "InfoSys",
        position: "Junior Developer",
        startDate: new Date('2021-07-01'),
        endDate: new Date('2024-06-30'),
        isCurrentlyWorking: false,
        description: "Web development"
      }
    ],
    gpa: "3.2",
    coursesOfInterest: [
      { courseName: "MSc Data Science", level: "Master's" }
    ],
    locationInterests: ["London"]
  },
  
  {
    // STUDENT 3: No Bachelor's - Should filter out Master's programs
    firstName: 'Charlie',
    lastName: 'Brown',
    email: 'charlie.test@example.com',
    password: 'Test123!',
    phoneNumber: '+44 7700 900003',
    dateOfBirth: new Date('2001-03-10'),
    nationality: 'American',
    englishProficiency: {
      testType: 'IELTS',
      scores: {
        overall: 7.0,
        listening: 7.0,
        reading: 7.5,
        writing: 6.5,
        speaking: 7.0
      },
      testDate: new Date('2024-05-20')
    },
    education: [
      {
        degree: "Higher Diploma in Computing",
        institution: "City College",
        fieldOfStudy: "Computing",
        graduationYear: "2023",
        gpa: "3.5"
      }
    ],
    workExperience: [],
    gpa: "3.5",
    coursesOfInterest: [
      { courseName: "BSc Computer Science", level: "Bachelor's" }
    ],
    locationInterests: ["Birmingham", "Manchester"]
  },
  
  {
    // STUDENT 4: Low GPA - Should filter out high GPA requirement courses
    firstName: 'Diana',
    lastName: 'Chen',
    email: 'diana.test@example.com',
    password: 'Test123!',
    phoneNumber: '+44 7700 900004',
    dateOfBirth: new Date('1997-11-25'),
    nationality: 'Chinese',
    englishProficiency: {
      testType: 'IELTS',
      scores: {
        overall: 6.5,
        listening: 6.5,
        reading: 7.0,
        writing: 6.0,
        speaking: 6.5
      },
      testDate: new Date('2024-08-15')
    },
    education: [
      {
        degree: "Bachelor of Arts in Business Administration",
        institution: "Shanghai University",
        fieldOfStudy: "Business Administration",
        graduationYear: "2019",
        gpa: "2.5"
      }
    ],
    workExperience: [
      {
        company: "Business Solutions Inc",
        position: "Business Analyst",
        startDate: new Date('2019-09-01'),
        endDate: new Date('2024-08-31'),
        isCurrentlyWorking: false,
        description: "Data analysis and reporting"
      }
    ],
    gpa: "2.5",
    coursesOfInterest: [
      { courseName: "MSc Business Analytics", level: "Master's" }
    ],
    locationInterests: ["London"]
  },
  
  {
    // STUDENT 5: Perfect Profile - Should qualify for everything
    firstName: 'Eva',
    lastName: 'Martinez',
    email: 'eva.test@example.com',
    password: 'Test123!',
    phoneNumber: '+44 7700 900005',
    dateOfBirth: new Date('1996-07-30'),
    nationality: 'Spanish',
    englishProficiency: {
      testType: 'IELTS',
      scores: {
        overall: 8.5,
        listening: 8.5,
        reading: 9.0,
        writing: 8.0,
        speaking: 8.5
      },
      testDate: new Date('2024-09-01')
    },
    education: [
      {
        degree: "Bachelor of Engineering in Software Engineering",
        institution: "Technical University of Madrid",
        fieldOfStudy: "Software Engineering",
        graduationYear: "2018",
        gpa: "3.9"
      },
      {
        degree: "Master of Science in Artificial Intelligence",
        institution: "ETH Zurich",
        fieldOfStudy: "Artificial Intelligence",
        graduationYear: "2020",
        gpa: "3.9"
      }
    ],
    workExperience: [
      {
        company: "Google",
        position: "Senior Software Engineer",
        startDate: new Date('2020-10-01'),
        endDate: new Date('2024-09-30'),
        isCurrentlyWorking: false,
        description: "Machine Learning Engineering"
      }
    ],
    gpa: "3.9",
    coursesOfInterest: [
      { courseName: "PhD Computer Science", level: "Doctoral" }
    ],
    locationInterests: ["London", "Oxford", "Cambridge"]
  }
];

async function createTestStudents() {
  try {
    console.log('\n🚀 Starting test student creation...\n');
    
    // Clear existing test students
    await Student.deleteMany({ 
      email: { $in: testStudents.map(s => s.email) } 
    });
    console.log('✅ Cleared existing test students\n');
    
    // Hash passwords and create students
    for (const studentData of testStudents) {
      const salt = await bcrypt.genSalt(10);
      studentData.password = await bcrypt.hash(studentData.password, salt);
      
      const student = await Student.create(studentData);
      
      console.log(`✅ Created: ${student.firstName} ${student.lastName}`);
      console.log(`   Email: ${student.email}`);
      console.log(`   IELTS: ${student.englishProficiency.scores.overall}`);
      console.log(`   GPA: ${student.gpa}`);
      console.log(`   Education: ${student.education.length} degree(s)`);
      console.log(`   Work Experience: ${student.workExperience.length} position(s)`);
      console.log('');
    }
    
    console.log('\n✅ All test students created successfully!');
    console.log('\n📊 Test Student Summary:');
    console.log('1. Alice Johnson - High achiever (IELTS: 7.5, GPA: 3.7, BSc CS + 4yr exp)');
    console.log('2. Bob Smith - Low IELTS (IELTS: 6.0, GPA: 3.2, BSc IT + 3yr exp)');
    console.log('3. Charlie Brown - No Bachelor\'s (IELTS: 7.0, GPA: 3.5, Diploma only)');
    console.log('4. Diana Chen - Low GPA (IELTS: 6.5, GPA: 2.5, BA Business + 5yr exp)');
    console.log('5. Eva Martinez - Perfect profile (IELTS: 8.5, GPA: 3.9, BSc+MSc + Google exp)');
    
    console.log('\n🔑 Login credentials for all: Password123!');
    console.log('\n📧 Test these accounts to verify entry requirements filtering!\n');
    
  } catch (error) {
    console.error('❌ Error creating test students:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔒 Database connection closed');
  }
}

// Run the script
createTestStudents();
