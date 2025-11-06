const CVExtractionService = require('./services/cvExtractionService');
const path = require('path');

async function testNewCV() {
  try {
    const cvPath = path.join(__dirname, 'uploads', 'cv', 'test-cv-new.pdf');
    console.log('Testing CV:', cvPath);
    console.log('\n=== EXTRACTING CV ===\n');
    
    const result = await CVExtractionService.extractCvData(cvPath);
    
    console.log('\n=== PERSONAL DETAILS ===');
    console.log('First Name:', result.firstName || '(empty)');
    console.log('Last Name:', result.lastName || '(empty)');
    console.log('Full Name:', result.firstName + ' ' + result.lastName);
    console.log('Email:', result.email || '(empty)');
    console.log('Phone:', result.phone || '(empty)');
    console.log('Address:', result.address || '(empty)');
    console.log('City:', result.city || '(empty)');
    console.log('Country:', result.country || '(empty)');
    
    console.log('\n=== EDUCATION ===');
    console.log('Degree:', result.degree || '(empty)');
    console.log('Institution:', result.institution || '(empty)');
    console.log('Graduation Year:', result.graduationYear || '(empty)');
    console.log('Education Level:', result.educationLevel || '(empty)');
    console.log('Education Array Length:', result.education?.length || 0);
    
    if (result.education && result.education.length > 0) {
      console.log('\n📚 ALL EDUCATION ENTRIES:');
      result.education.forEach((edu, index) => {
        console.log(`\n  ${index + 1}. ${edu.degree || '(no degree)'}`);
        console.log(`     Institution: ${edu.institution || '(no institution)'}`);
        console.log(`     Year: ${edu.graduationYear || 'Not specified'}`);
        console.log(`     GPA: ${edu.gpa || 'Not specified'}`);
      });
    }
    
    console.log('\n=== WORK EXPERIENCE ===');
    console.log('Work Experience Count:', result.workExperience?.length || 0);
    if (result.workExperience && result.workExperience.length > 0) {
      result.workExperience.forEach((exp, index) => {
        console.log(`\n  ${index + 1}. ${exp.jobTitle || '(no title)'}`);
        console.log(`     Company: ${exp.companyName || '(no company)'}`);
        console.log(`     Duration: ${exp.startDate || '?'} - ${exp.endDate || '?'}`);
        console.log(`     Description: ${exp.description || '(no description)'}`);
      });
    }
    
    console.log('\n=== SKILLS ===');
    console.log('Skills:', result.skills?.join(', ') || '(empty)');
    
    console.log('\n=== LINKS ===');
    console.log('GitHub:', result.githubUrl || '(empty)');
    console.log('LinkedIn:', result.linkedinUrl || '(empty)');
    console.log('Portfolio:', result.portfolioUrl || '(empty)');
    
  } catch (error) {
    console.error('Error testing CV:', error);
  }
}

testNewCV();
