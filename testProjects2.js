const pdfParse = require('pdf-parse');
const fs = require('fs');

async function testProjectExtraction() {
  const dataBuffer = fs.readFileSync('uploads/cv/test-cv-new.pdf');
  const pdfData = await pdfParse(dataBuffer);
  const text = pdfData.text || '';
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  const projectKeywords = ['accomplishments', 'projects', 'project', 'key projects'];
  let inProjectsSection = false;
  const projects = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lineLower = line.toLowerCase();
    
    // Check if we're entering projects/accomplishments section
    if (projectKeywords.some(keyword => lineLower === keyword)) {
      console.log(`Found section at line ${i}: "${line}"`);
      inProjectsSection = true;
      continue;
    }

    // Pattern: "Project title/description - Year1- Year2" or "Appointed as... – Year1- Year2"
    if (inProjectsSection && line.length > 10) {
      // Check if line contains a date range (e.g., "2019- 2022" or "2018- 2019")
      const yearRangePattern = /(\d{4})\s*[-–—]\s*(\d{4})/;
      const match = line.match(yearRangePattern);
      
      if (match) {
        const startYear = match[1];
        const endYear = match[2];
        
        // Extract project title (everything before the date)
        const title = line.replace(yearRangePattern, '').replace(/[–\-—]\s*$/, '').trim();
        
        console.log(`\nMatched at line ${i}:`);
        console.log(`  Title: "${title}"`);
        console.log(`  Years: ${startYear} - ${endYear}`);
        console.log(`  Title length: ${title.length}`);
        
        // Skip if title is too short or looks like education
        const educationKeywords = ['msc', 'bachelor', 'master', 'diploma', 'degree', 'phd', 'doctorate', 'bsc'];
        const isEducation = educationKeywords.some(keyword => {
          const regex = new RegExp(`\\b${keyword}\\b`, 'i');
          return regex.test(title);
        });
        
        console.log(`  Is education: ${isEducation}`);
        
        if (isEducation || title.length < 10) {
          console.log(`  SKIPPED (education=${isEducation}, length=${title.length})`);
          continue;
        }
        
        console.log(`  ✓ ADDED TO PROJECTS`);
        
        projects.push({
          title: title,
          description: '',
          startDate: `${startYear}-01-01`,
          endDate: `${endYear}-12-31`,
          technologies: []
        });
      }
    }

    if (i > 200) break;
  }

  console.log(`\n\n=== FINAL RESULT ===`);
  console.log(`Total projects: ${projects.length}`);
  projects.forEach((p, i) => {
    console.log(`${i + 1}. ${p.title} (${p.startDate.substring(0, 4)}-${p.endDate.substring(0, 4)})`);
  });
}

testProjectExtraction();
