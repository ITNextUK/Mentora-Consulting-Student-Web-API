const pdf = require('pdf-parse');
const fs = require('fs');

const cvPath = 'd:/vihin/Documents/Github/ITNEXT/Mentora-Consulting-Student-Web-API/uploads/cv/cv-690a5b98c19c22dcb0d7f87e-1762291042074-43297965.pdf';

pdf(fs.readFileSync(cvPath)).then(data => {
  const lines = data.text.split('\n');
  
  // Find education section
  const eduIdx = lines.findIndex(l => l.toLowerCase().includes('education'));
  
  if (eduIdx !== -1) {
    console.log('=== EDUCATION SECTION ===\n');
    lines.slice(eduIdx, Math.min(eduIdx + 35, lines.length)).forEach((line, i) => {
      console.log(`Line ${i}: "${line}"`);
    });
  }
}).catch(err => console.error(err));
