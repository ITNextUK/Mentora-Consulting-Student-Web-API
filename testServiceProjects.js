const cvExtractionService = require('./services/cvExtractionService');

const cvPath = 'uploads/cv/test-cv-new.pdf';

(async () => {
  try {
    const result = await cvExtractionService.extractCvData(cvPath);
    
    console.log('\n=== PROJECTS ===');
    console.log('Total:', result.data.projects.length);
    result.data.projects.forEach((p, i) => {
      console.log(`${i + 1}. ${p.title} (${p.startDate} - ${p.endDate})`);
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
