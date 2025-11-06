const pdfParse = require('pdf-parse');
const fs = require('fs');
const path = require('path');

async function extractPersonalDetails() {
  try {
    const cvPath = path.join(__dirname, 'uploads', 'cv', 'test-cv-new.pdf');
    console.log('Extracting from:', cvPath);
    
    const dataBuffer = fs.readFileSync(cvPath);
    const data = await pdfParse(dataBuffer);
    const text = data.text;
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    console.log('\n=== EXTRACTING PERSONAL DETAILS ===\n');
    
    // Name extraction - first line, handle spacing issues from PDF
    let name = '';
    const firstLine = lines[0] || '';
    
    // Clean up excessive spaces that often occur in PDF extraction
    const cleanedFirstLine = firstLine.replace(/\s+/g, ' ').trim();
    
    // Check if first line looks like a name
    if (cleanedFirstLine.length > 3 && cleanedFirstLine.length < 100) {
      // Allow letters, spaces, hyphens, dots, apostrophes
      if (/^[A-Za-z\s\-\.\']+$/.test(cleanedFirstLine)) {
        // Check it's not a common header
        const lowerLine = cleanedFirstLine.toLowerCase();
        if (!lowerLine.includes('curriculum') && 
            !lowerLine.includes('resume') && 
            !lowerLine.includes('cv') &&
            !lowerLine.includes('profile') &&
            !lowerLine.includes('contact')) {
          name = cleanedFirstLine;
          console.log(`Found name at line 0: "${name}"`);
          console.log(`(Original with spacing issues: "${firstLine}")`);
        }
      }
    }
    
    // If still no name found, try first few lines
    if (!name) {
      for (let i = 1; i < Math.min(10, lines.length); i++) {
        const line = lines[i];
        // Check if line has mostly letters (allowing spaces)
        if (line.length > 5 && line.length < 100) {
          // Remove extra spaces and check if it looks like a name
          const cleanLine = line.replace(/\s+/g, ' ').trim();
          // Check if it contains letters and spaces only (allow some punctuation)
          if (/^[A-Za-z\s\-\.]+$/.test(cleanLine)) {
            // Check if it has at least 2 words
            const words = cleanLine.split(' ').filter(w => w.length > 0);
            if (words.length >= 2 && words.length <= 6) {
              name = cleanLine;
              console.log(`Found name at line ${i}: "${name}"`);
              break;
            }
          }
        }
      }
    }
    
    // Email extraction
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emailMatch = text.match(emailRegex);
    const email = emailMatch ? emailMatch[0] : '';
    console.log(`Email: ${email}`);
    
    // Phone extraction
    const phoneRegex = /(?:Phone:\s*)?(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4,}/g;
    const phoneMatch = text.match(phoneRegex);
    const phone = phoneMatch ? phoneMatch[0].replace('Phone:', '').trim() : '';
    console.log(`Phone: ${phone}`);
    
    // Address extraction
    let address = '';
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].toLowerCase().includes('address:')) {
        address = lines[i].replace(/address:/i, '').trim();
        console.log(`Address: ${address}`);
        break;
      }
    }
    
    // LinkedIn extraction
    const linkedinRegex = /(?:LinkedIn:\s*)?(https?:\/\/(?:www\.)?linkedin\.com\/in\/[^\s]+)/gi;
    const linkedinMatch = text.match(linkedinRegex);
    const linkedin = linkedinMatch ? linkedinMatch[0].replace(/LinkedIn:\s*/i, '').trim() : '';
    console.log(`LinkedIn: ${linkedin}`);
    
    // Extract city and postal code from address
    let city = '';
    let postcode = '';
    if (address) {
      // UK postcode pattern
      const postcodeMatch = address.match(/[A-Z]{1,2}\d{1,2}\s?\d[A-Z]{2}/i);
      if (postcodeMatch) {
        postcode = postcodeMatch[0];
        // City is usually before the postcode
        const parts = address.split(',').map(p => p.trim());
        if (parts.length >= 2) {
          city = parts[parts.length - 2].replace(postcode, '').trim();
        }
      }
    }
    console.log(`City: ${city}`);
    console.log(`Postcode: ${postcode}`);
    
    // Parse name into first and last
    let firstName = '';
    let lastName = '';
    if (name) {
      // Try to fix common PDF spacing issues
      // If we see many short word fragments, try to merge them intelligently
      const words = name.split(/\s+/).filter(w => w.length > 0);
      
      // Count short words (1-4 chars) - if many, likely a spacing issue
      const shortWords = words.filter(w => w.length <= 4).length;
      const hasSpacingIssue = shortWords >= words.length * 0.5 && words.length > 3;
      
      let fixedName = name;
      if (hasSpacingIssue) {
        console.log(`\nDetected spacing issue: ${words.length} words, ${shortWords} are short`);
        
        // Strategy: Merge consecutive short words with longer words
        // Heuristic: First half is first name, second half is last name
        const midPoint = Math.floor(words.length / 2);
        const firstNameParts = words.slice(0, midPoint);
        const lastNameParts = words.slice(midPoint);
        
        const firstName = firstNameParts.join('');
        const lastName = lastNameParts.join('');
        fixedName = firstName + ' ' + lastName;
        
        console.log(`Fixed spacing: "${name}" -> "${fixedName}"`);
      }
      
      const nameParts = fixedName.split(' ').filter(p => p.length > 0);
      if (nameParts.length >= 2) {
        firstName = nameParts[0];
        lastName = nameParts.slice(1).join(' ');
      } else if (nameParts.length === 1) {
        // Single name after merging
        firstName = nameParts[0];
      }
    }
    
    console.log(`\n=== PARSED RESULTS ===`);
    console.log(`First Name: ${firstName}`);
    console.log(`Last Name: ${lastName}`);
    console.log(`Email: ${email}`);
    console.log(`Phone: ${phone}`);
    console.log(`Address: ${address}`);
    console.log(`City: ${city}`);
    console.log(`LinkedIn: ${linkedin}`);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

extractPersonalDetails();
