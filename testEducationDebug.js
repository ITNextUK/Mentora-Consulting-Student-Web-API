const fs = require('fs');
const pdf = require('pdf-parse');
const path = require('path');

// Read the PDF
const pdfPath = path.join(__dirname, 'uploads/cv/test-cv-new.pdf');
const dataBuffer = fs.readFileSync(pdfPath);

pdf(dataBuffer).then(function(data) {
  const text = data.text;
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  // Find education section
  let inEducation = false;
  let educationLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineLower = line.toLowerCase();
    
    if (lineLower === 'education' || lineLower === 'education:') {
      inEducation = true;
      continue;
    }
    
    if (inEducation) {
      if (lineLower === 'work experience' || lineLower === 'employment' || 
          lineLower === 'experience' || lineLower === 'skills' || 
          lineLower === 'projects') {
        break;
      }
      educationLines.push(line);
    }
  }
  
  console.log('=== EDUCATION LINES ===\n');
  
  // Test each line
  for (let i = 0; i < educationLines.length; i++) {
    const line = educationLines[i];
    const lineLower = line.toLowerCase();
    
    // Test isDegree
    const isDegree = (lineLower.includes('bachelor') || lineLower.includes('master') || 
                     lineLower.includes('phd') || lineLower.includes('diploma') || 
                     lineLower.includes('bit') || lineLower.includes('b.it') ||
                     lineLower.includes('bsc') || lineLower.includes('b.sc') || 
                     lineLower.includes('msc') || lineLower.includes('m.sc') ||
                     lineLower.includes('ba') || lineLower.includes('b.a') ||
                     lineLower.includes('ma') || lineLower.includes('m.a') ||
                     lineLower.includes('mba') || lineLower.includes('m.b.a') ||
                     (lineLower.includes('science') && lineLower.includes('in'))) &&
                    !lineLower.includes('major:');
    
    const isInstitution = (lineLower.includes('university') || lineLower.includes('college') || 
                          lineLower.includes('institute') || lineLower.includes('school') &&
                          !lineLower.includes('high school') && !lineLower.includes('vidyalaya'));
    
    const isInstitutionOnly = isInstitution && !isDegree;
    
    // Focus on institution lines
    if (line.includes('Colombo')) {
      console.log(`Line ${i}: ${line}`);
      console.log(`  isDegree: ${isDegree}`);
      console.log(`  isInstitution: ${isInstitution}`);
      console.log(`  isInstitutionOnly: ${isInstitutionOnly}`);
      console.log(`  lineLower includes 'computing': ${lineLower.includes('computing')}`);
      console.log('');
    }
  }
});
