const CVExtractionService = require('./services/cvExtractionService');
const path = require('path');

async function testExtraction() {
  const cvPath = path.join(__dirname, 'uploads/cv/cv-690a5b98c19c22dcb0d7f87e-1762287270193-514136436.pdf');
  
  try {
    const response = await CVExtractionService.extractCvData(cvPath);
    
    if (!response.success) {
      console.error('❌ Extraction failed:', response.message);
      return;
    }
    
    const result = response.data;
    console.log('\n📄 CV EXTRACTION RESULT:\n');
    console.log('='.repeat(60));
    
    console.log('\n👤 PERSONAL INFO:');
    console.log('Name:', result.firstName, result.lastName);
    console.log('Email:', result.email);
    console.log('Phone:', result.phone);
    console.log('Location:', result.city, ',', result.country);
    
    console.log('\n💼 WORK EXPERIENCE:');
    if (result.workExperience && result.workExperience.length > 0) {
      result.workExperience.forEach((work, i) => {
        console.log(`\n  ${i + 1}. ${work.position}`);
        console.log(`     Company: ${work.company}`);
        console.log(`     Start Date: ${work.startDate}`);
        console.log(`     End Date: ${work.endDate}`);
      });
    } else {
      console.log('  No work experience extracted');
    }
    
    console.log('\n🎓 EDUCATION:');
    console.log('Degree:', result.degree);
    console.log('Institution:', result.institution);
    console.log('Graduation Year:', result.graduationYear);
    console.log('Education Level:', result.educationLevel);
    
    console.log('\n💡 SKILLS:');
    if (result.skills && result.skills.length > 0) {
      console.log(result.skills.slice(0, 15).join(', '));
    }
    
    console.log('\n🔗 REFERENCE LINKS:');
    console.log('GitHub:', result.githubUrl || 'Not found');
    console.log('LinkedIn:', result.linkedinUrl || 'Not found');
    console.log('Portfolio:', result.portfolioUrl || 'Not found');
    
    console.log('\n\n' + '='.repeat(60));
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

testExtraction();
