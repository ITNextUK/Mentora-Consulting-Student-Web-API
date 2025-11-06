const pdfParse = require('pdf-parse');
const fs = require('fs');
const path = require('path');

async function viewEducationSection() {
  try {
    const cvPath = path.join(__dirname, 'uploads', 'cv', 'test-cv-new.pdf');
    const dataBuffer = fs.readFileSync(cvPath);
    const data = await pdfParse(dataBuffer);
    
    const text = data.text;
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    console.log('=== FINDING EDUCATION SECTION ===\n');
    
    let inEducation = false;
    let educationLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineLower = line.toLowerCase();
      
      if (lineLower === 'education') {
        console.log(`Found "Education" at line ${i}`);
        inEducation = true;
        continue;
      }
      
      if (inEducation) {
        // Stop at next section
        if (lineLower === 'experience' || lineLower === 'skills' || 
            lineLower === 'projects' || lineLower === 'certifications') {
          console.log(`\nStopped at line ${i}: "${line}"\n`);
          break;
        }
        educationLines.push({ index: i, line });
      }
    }
    
    console.log(`\n=== EDUCATION SECTION (${educationLines.length} lines) ===\n`);
    educationLines.forEach(({ index, line }) => {
      const firstChar = line.charCodeAt(0);
      console.log(`${index}: [${firstChar}] ${line.substring(0, 80)}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

viewEducationSection();
