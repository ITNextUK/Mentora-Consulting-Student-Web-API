const pdfParse = require('pdf-parse');
const chrono = require('chrono-node');
const fs = require('fs');

async function debugFirstEntry() {
  const dataBuffer = fs.readFileSync('uploads/cv/test-cv-new.pdf');
  const pdfData = await pdfParse(dataBuffer);
  const lines = pdfData.text.split('\n').map(l => l.trim());
  
  let inWorkSection = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lineLower = line.toLowerCase();
    
    // Check if we're entering work section
    if (lineLower === 'experience' || lineLower === 'work experience') {
      console.log(`Line ${i}: Found work section header: "${line}"`);
      inWorkSection = true;
      continue;
    }
    
    if (!inWorkSection) continue;
    
    // Check first 10 lines after "Experience"
    if (i < 35 && line.includes('|')) {
      console.log(`\nLine ${i}: Found pipe separator`);
      console.log(`  Content: "${line}"`);
      
      const pipePattern = /^(.+?)\s*\|\s*(.+)$/;
      const match = line.match(pipePattern);
      
      if (match) {
        const position = match[1].trim();
        const dateText = match[2].trim();
        
        console.log(`  Position: "${position}"`);
        console.log(`  Date Text: "${dateText}"`);
        
        // Check education filter
        const educationKeywords = ['msc', 'bachelor', 'master', 'diploma', 'degree', 'phd', 'doctorate', 'bsc', 'ba', 'ma'];
        const isEducation = educationKeywords.some(keyword => position.toLowerCase().includes(keyword));
        
        console.log(`  Is Education: ${isEducation}`);
        
        // Check date parsing
        const dates = chrono.parse(dateText);
        console.log(`  Dates parsed: ${dates.length > 0 ? 'YES' : 'NO'}`);
        if (dates.length > 0) {
          const firstDate = dates[0].start;
          console.log(`  Start year: ${firstDate ? firstDate.get('year') : 'N/A'}`);
        }
        
        // Check next line for company
        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1].trim();
          console.log(`  Next line: "${nextLine}"`);
        }
      }
    }
    
    if (i > 110) break; // Stop after education section
  }
}

debugFirstEntry();
