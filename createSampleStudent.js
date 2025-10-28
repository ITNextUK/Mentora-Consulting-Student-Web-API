/**
 * Script to create a sample student account for testing
 * Run: node createSampleStudent.js
 */

const http = require('http');

const API_BASE = 'localhost';
const API_PORT = 3001;
const API_PREFIX = '/api/v1';

const sampleStudent = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@test.com',
  password: 'SecurePass123!',
  phone: '+441234567890'
};

function makeRequest(path, method, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: API_BASE,
      port: API_PORT,
      path: API_PREFIX + path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ status: res.statusCode, data: response });
          } else {
            reject({ status: res.statusCode, data: response });
          }
        } catch (e) {
          reject({ status: res.statusCode, error: 'Invalid JSON response' });
        }
      });
    });
    
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function createAndLoginSample() {
  try {
    console.log('🔄 Creating sample student account...\n');
    
    // Try to register
    try {
      await makeRequest('/auth/register', 'POST', sampleStudent);
      console.log('✅ Sample student registered successfully!');
      console.log('📧 Email:', sampleStudent.email);
      console.log('🔑 Password:', sampleStudent.password);
      console.log('');
    } catch (registerError) {
      if (registerError.status === 400 && registerError.data?.message?.includes('already exists')) {
        console.log('ℹ️  Sample student already exists, proceeding to login...\n');
      } else {
        throw registerError;
      }
    }
    
    // Login to get token
    console.log('🔄 Logging in...\n');
    const loginResponse = await makeRequest('/auth/login', 'POST', {
      email: sampleStudent.email,
      password: sampleStudent.password
    });
    
    const { token, student } = loginResponse.data.data;
    
    console.log('✅ Login successful!\n');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📋 SAMPLE STUDENT DETAILS');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log('👤 Student Info:');
    console.log('   Name:', student.firstName, student.lastName);
    console.log('   Email:', student.email);
    console.log('   Phone:', student.phone || 'Not set');
    console.log('   Student ID:', student.student_id);
    console.log('');
    console.log('🔐 Authentication:');
    console.log('   Email:', sampleStudent.email);
    console.log('   Password:', sampleStudent.password);
    console.log('');
    console.log('🎫 JWT Token (use this in frontend):');
    console.log('   ', token);
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log('📝 TO USE IN FRONTEND:');
    console.log('');
    console.log('1. Open browser console on http://localhost:5173');
    console.log('2. Run this command:');
    console.log('');
    console.log('   localStorage.setItem("studentToken", "' + token + '")');
    console.log('');
    console.log('3. Refresh the page and you\'ll be authenticated!');
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    
  } catch (error) {
    console.error('❌ Error:', error.data?.message || error.message || error);
    console.error('');
    console.error('Make sure the backend API is running on http://localhost:3001');
    console.error('Run: npm run dev');
  }
}

createAndLoginSample();
