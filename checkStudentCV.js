/**
 * Check student CV path in database
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('./models/StudentMongo');

async function checkStudentCV() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all students
    const students = await Student.find({});
    console.log(`\n📊 Found ${students.length} student(s)\n`);

    students.forEach((student, index) => {
      console.log(`Student ${index + 1}:`);
      console.log(`  ID: ${student._id}`);
      console.log(`  Name: ${student.firstName} ${student.lastName}`);
      console.log(`  Email: ${student.email}`);
      console.log(`  CV Path: ${student.cvPath || 'NOT SET'}`);
      console.log(`  Profile Picture: ${student.profilePicture || 'NOT SET'}`);
      console.log(`  Created: ${student.createdAt}`);
      console.log('---');
    });

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkStudentCV();
