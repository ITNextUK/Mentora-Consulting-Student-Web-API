const CVExtractionService = require('./services/cvExtractionService');
const path = require('path');
const pdfParse = require('pdf-parse');
const fs = require('fs');

async function testNewCV() {
  try {
    const cvPath = path.join(__dirname, 'uploads', 'cv', 'test-cv-new.pdf');
    console.log('Testing CV:', cvPath);
    
    // First check if PDF can be read
    console.log('\n=== CHECKING PDF READABILITY ===');
    const dataBuffer = fs.readFileSync(cvPath);
    const pdfData = await pdfParse(dataBuffer);
    console.log('PDF Pages:', pdfData.numpages);
    console.log('Text length:', pdfData.text.length);
    console.log('First 200 chars:', pdfData.text.substring(0, 200));
    
    console.log('\n=== EXTRACTING CV ===\n');
    
    const result = await CVExtractionService.extractCvData(cvPath);
    
    console.log('\n=== RAW RESULT ===');
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('Error testing CV:', error);
    console.error('Stack:', error.stack);
  }
}

testNewCV();
