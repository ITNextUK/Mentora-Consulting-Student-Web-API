const CVExtractionService = require('./services/cvExtractionService');

const cvPath = 'uploads/cv/test-cv-new.pdf';

(async () => {
  try {
    const result = await CVExtractionService.extractCvData(cvPath);
    
    console.log('\n=== SKILLS ===');
    console.log('Total:', result.data.skills.length);
    console.log('Skills:', result.data.skills.slice(0, 15).join(', '));
    
    console.log('\n=== REFERENCE LINKS ===');
    console.log('GitHub:', result.data.github || result.data.githubUrl || 'Not found');
    console.log('LinkedIn:', result.data.linkedin || result.data.linkedinUrl || 'Not found');
    console.log('Portfolio:', result.data.portfolio || result.data.portfolioUrl || 'Not found');
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
