const pdfParse = require('pdf-parse');
const fs = require('fs');
const path = require('path');

async function viewCV() {
  try {
    const cvPath = path.join(__dirname, 'uploads', 'cv', 'test-cv-new.pdf');
    console.log('Reading CV:', cvPath);
    
    const dataBuffer = fs.readFileSync(cvPath);
    const data = await pdfParse(dataBuffer);
    
    console.log('\n=== RAW TEXT ===');
    console.log(data.text);
    
    console.log('\n\n=== LINES ===');
    const lines = data.text.split('\n').filter(line => line.trim().length > 0);
    lines.forEach((line, i) => {
      console.log(`${i}: ${line}`);
    });
    
    console.log('\n\n=== STATISTICS ===');
    console.log('Total characters:', data.text.length);
    console.log('Total lines:', lines.length);
    console.log('Pages:', data.numpages);
    
  } catch (error) {
    console.error('Error reading CV:', error);
  }
}

viewCV();
