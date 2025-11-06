const CVExtractionService = require('./services/cvExtractionService');
const path = require('path');

async function testWorkExperience() {
  try {
    const cvPath = path.join(__dirname, 'uploads', 'cv', 'test-cv-new.pdf');
    console.log('Testing Work Experience Extraction\n');
    
    const result = await CVExtractionService.extractCvData(cvPath);
    const workExp = result.data.workExperience;
    
    console.log('Total Work Experience Entries:', workExp.length);
    console.log('\n');
    
    workExp.forEach((exp, index) => {
      console.log(`Entry ${index + 1}:`);
      console.log(`  Position: ${exp.position}`);
      console.log(`  Company: ${exp.company}`);
      console.log(`  Start Date: ${exp.startDate}`);
      console.log(`  End Date: ${exp.endDate}`);
      console.log(`  Description: ${exp.description.substring(0, 100)}${exp.description.length > 100 ? '...' : ''}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testWorkExperience();
