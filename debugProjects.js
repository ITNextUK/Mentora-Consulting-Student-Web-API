const pdfParse = require('pdf-parse');
const fs = require('fs');

async function debugProjects() {
  const dataBuffer = fs.readFileSync('uploads/cv/test-cv-new.pdf');
  const pdfData = await pdfParse(dataBuffer);
  const lines = pdfData.text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  const projectKeywords = ['accomplishments', 'projects', 'project', 'key projects'];
  let inProjectsSection = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lineLower = line.toLowerCase();
    
    // Check if we're entering projects/accomplishments section
    if (projectKeywords.some(keyword => lineLower === keyword)) {
      console.log(`\nLine ${i}: Found projects section: "${line}"`);
      inProjectsSection = true;
      continue;
    }

    if (!inProjectsSection) continue;
    
    // Check first 20 lines after section start
    if (i < 105) {
      console.log(`Line ${i}: ${line.substring(0, 80)}`);
      
      // Check if line contains a date range
      const yearRangePattern = /(\d{4})\s*[-–—]\s*(\d{4})/;
      const match = line.match(yearRangePattern);
      
      if (match) {
        console.log(`  ✓ MATCHED! Years: ${match[1]} - ${match[2]}`);
      }
    }
    
    if (i > 105) break;
  }
}

debugProjects();
