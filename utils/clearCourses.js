const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB Atlas\n');
  } catch (error) {
    console.error('❌ Connection Error:', error.message);
    process.exit(1);
  }
};

// Define schema
const universityCourseSchema = new mongoose.Schema({}, { strict: false, collection: 'universitycourses' });
const UniversityCourse = mongoose.model('UniversityCourse', universityCourseSchema);

const main = async () => {
  await connectDB();
  
  console.log('⚠️  WARNING: This will delete all existing courses!');
  console.log('Deleting in 3 seconds... Press Ctrl+C to cancel\n');
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  const result = await UniversityCourse.deleteMany({});
  console.log(`✅ Deleted ${result.deletedCount} courses\n`);
  
  mongoose.connection.close();
};

main();
