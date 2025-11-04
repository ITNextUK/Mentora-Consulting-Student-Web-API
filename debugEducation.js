const CVExtractionService = require('./services/cvExtractionService');
const path = require('path');

async function debugEducation() {
  const cvPath = path.join(__dirname, 'uploads/cv/cv-690a5b98c19c22dcb0d7f87e-1762291042074-43297965.pdf');
  
  try {
    console.log('Testing CV:', cvPath);
    const response = await CVExtractionService.extractCvData(cvPath);
    
    if (!response.success) {
      console.error('❌ Extraction failed:', response.message);
      return;
    }
    
    const result = response.data;
    
    console.log('\n=== EDUCATION DEBUG ===');
    console.log('degree:', result.degree);
    console.log('institution:', result.institution);
    console.log('graduationYear:', result.graduationYear);
    console.log('education array:', JSON.stringify(result.education, null, 2));
    console.log('educationLevel:', result.educationLevel);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

debugEducation();
