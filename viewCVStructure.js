const pdf = require('pdf-parse');
const fs = require('fs');

const cvPath = 'd:/vihin/Documents/Github/ITNEXT/Mentora-Consulting-Student-Web-API/uploads/cv/cv-690a5b98c19c22dcb0d7f87e-1762288420166-88207152.pdf';

pdf(fs.readFileSync(cvPath)).then(data => {
  const lines = data.text.split('\n');
  
  // Find projects section
  const projIdx = lines.findIndex(l => l.toLowerCase().includes('project'));
  
  if (projIdx !== -1) {
    console.log('=== PROJECTS/WORK EXPERIENCE SECTION ===\n');
    lines.slice(projIdx, Math.min(projIdx + 25, lines.length)).forEach((line, i) => {
      console.log(`Line ${i}: "${line}"`);
    });
  }
  
  // Also check for experience section
  const expIdx = lines.findIndex(l => l.toLowerCase().includes('experience'));
  if (expIdx !== -1 && expIdx !== projIdx) {
    console.log('\n\n=== EXPERIENCE SECTION ===\n');
    lines.slice(expIdx, Math.min(expIdx + 25, lines.length)).forEach((line, i) => {
      console.log(`Line ${i}: "${line}"`);
    });
  }
}).catch(err => console.error(err));
