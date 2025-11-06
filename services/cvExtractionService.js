const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const path = require('path');
const fs = require('fs');
const { parsePhoneNumber } = require('libphonenumber-js');
const chrono = require('chrono-node');
const emailAddresses = require('email-addresses');
const urlRegex = require('url-regex-safe');
const natural = require('natural');
const compromise = require('compromise');

class CVExtractionService {
  /**
   * Extract data from uploaded CV file
   * @param {string} filePath - Path to the uploaded CV file
   * @returns {Promise<Object>} Extracted CV data
   */
  static async extractCvData(filePath) {
    try {
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw new Error('CV file not found');
      }

      // Determine file type and extract text accordingly
      const fileExtension = path.extname(filePath).toLowerCase();
      let parsedData;

      if (fileExtension === '.pdf') {
        // Parse PDF using pdf-parse
        const dataBuffer = fs.readFileSync(filePath);
        parsedData = await pdfParse(dataBuffer);
      } else if (fileExtension === '.docx') {
        // Parse DOCX using mammoth
        parsedData = await this.extractFromDocx(filePath);
      } else if (fileExtension === '.doc') {
        // For .doc files, we'll need a different approach
        // For now, throw an error suggesting to convert to DOCX
        throw new Error('DOC files are not supported. Please convert to DOCX format.');
      } else {
        throw new Error('Unsupported file format. Only PDF and DOCX files are supported.');
      }
      
      // Structure the extracted data to match our frontend expectations
      const structuredData = this.structureExtractedData(parsedData);
      
      return {
        success: true,
        data: structuredData,
        message: 'CV data extracted successfully'
      };
      
    } catch (error) {
      console.error('CV extraction error:', error);
      
      return {
        success: false,
        data: null,
        message: 'Failed to extract CV data: ' + error.message
      };
    }
  }

  /**
   * Extract text from DOCX file
   * @param {string} filePath - Path to the DOCX file
   * @returns {Promise<Object>} Extracted text data
   */
  static async extractFromDocx(filePath) {
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      return { text: result.value };
    } catch (error) {
      console.error('DOCX extraction error:', error);
      throw new Error('Failed to extract text from DOCX file: ' + error.message);
    }
  }

  /**
   * Structure the raw parsed data into our expected format
   * @param {Object} rawData - Raw data from pdf-parse or mammoth
   * @returns {Object} Structured data
   */
  static structureExtractedData(rawData) {
    const structured = {
      // Personal Details
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      country: '',
      
      // Education Details (single - for backward compatibility)
      degree: '',
      institution: '',
      graduationYear: '',
      gpa: '',
      ieltsScore: '',
      englishLevel: '',
      
      // Education Array (multiple education entries)
      education: [],
      
      // Qualifications (A-Levels, O-Levels, etc.)
      qualifications: [],
      
      // Work Experience
      workExperience: [],
      
      // Skills
      skills: [],
      
      // Reference Links
      githubUrl: '',
      linkedinUrl: '',
      portfolioUrl: ''
    };

    try {
      const text = rawData.text || '';
      const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

      // Enhanced name extraction with PDF spacing issue handling
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
          }
        }
      }
      
      // If first line isn't a name, try NLP approach
      if (!name) {
        const nameDoc = compromise(text);
        const people = nameDoc.people().out('array');
        
        if (people && people.length > 0) {
          name = people[0];
        }
      }
      
      // Fallback: Look for name patterns in first few lines
      if (!name) {
        for (let i = 0; i < Math.min(5, lines.length); i++) {
          const line = lines[i].trim();
          // Skip lines that look like contact info or headers
          if (line.includes('@') || line.includes('phone') || line.includes('email') || 
              line.includes('address') || line.includes('resume') || line.includes('cv') ||
              line.toLowerCase().includes('curriculum')) {
            continue;
          }
          
          // Look for name patterns (2-4 words, primarily letters)
          const cleanLine = line.replace(/\s+/g, ' ').trim();
          if (cleanLine.length > 3 && cleanLine.length < 50 && /^[A-Za-z\s\-\.]+$/.test(cleanLine)) {
            const nameParts = cleanLine.split(/\s+/);
            if (nameParts.length >= 2 && nameParts.length <= 4) {
              name = cleanLine;
              break;
            }
          }
        }
      }
      
      // Parse name into first and last, handling PDF spacing issues
      if (name) {
        const words = name.split(/\s+/).filter(w => w.length > 0);
        
        // Count short words (1-4 chars) - if many, likely a spacing issue
        const shortWords = words.filter(w => w.length <= 4).length;
        const hasSpacingIssue = shortWords >= words.length * 0.5 && words.length > 3;
        
        let fixedName = name;
        if (hasSpacingIssue) {
          // Strategy: Merge consecutive short words
          // Heuristic: First half is first name, second half is last name
          const midPoint = Math.floor(words.length / 2);
          const firstNameParts = words.slice(0, midPoint);
          const lastNameParts = words.slice(midPoint);
          
          const mergedFirst = firstNameParts.join('');
          const mergedLast = lastNameParts.join('');
          fixedName = mergedFirst + ' ' + mergedLast;
        }
        
        const nameParts = fixedName.split(/\s+/).filter(p => p.length > 0);
        if (nameParts.length >= 2) {
          structured.firstName = nameParts[0];
          structured.lastName = nameParts.slice(1).join(' ');
        } else if (nameParts.length === 1) {
          structured.firstName = nameParts[0];
        }
      }

      // Enhanced email extraction using email-addresses library
      const parsedEmails = emailAddresses.parseAddressList(text);
      if (parsedEmails && parsedEmails.length > 0) {
        // Take the first valid email
        const validEmail = parsedEmails.find(email => 
          email.address && 
          !email.address.includes('noreply') && 
          !email.address.includes('no-reply') && 
          !email.address.includes('admin@') &&
          !email.address.includes('info@')
        );
        
        if (validEmail) {
          structured.email = validEmail.address;
          // Extract name from email if not already found
          if (!structured.firstName && validEmail.name) {
            const nameParts = validEmail.name.split(/\s+/);
            if (nameParts.length >= 2) {
              structured.firstName = nameParts[0];
              structured.lastName = nameParts.slice(1).join(' ');
            }
          }
        }
      }
      
      // Fallback: Basic regex if library doesn't find email
      if (!structured.email) {
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const emailMatches = text.match(emailRegex);
        if (emailMatches && emailMatches.length > 0) {
          const personalEmail = emailMatches.find(email => 
            !email.includes('noreply') && 
            !email.includes('no-reply') && 
            !email.includes('admin@') &&
            !email.includes('info@')
          );
          structured.email = personalEmail || emailMatches[0];
        }
      }

      // Enhanced phone number extraction using libphonenumber-js
      const phoneRegexes = [
        /(\+?94|0)?[0-9]{2,3}[-\s]?[0-9]{7}/g, // Sri Lankan format
        /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g, // US format
        /(\+?44[-.\s]?)?\(?([0-9]{4})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{3})/g, // UK format
        /(\+?91[-.\s]?)?\(?([0-9]{5})\)?[-.\s]?([0-9]{5})/g, // Indian format
        /(\+?[1-9]\d{1,14})/g // International format
      ];
      
      for (const regex of phoneRegexes) {
        const phoneMatch = text.match(regex);
        if (phoneMatch && phoneMatch.length > 0) {
          const rawPhone = phoneMatch[0];
          
          // Try to parse and validate using libphonenumber-js
          try {
            // Try common countries
            const countries = ['LK', 'US', 'GB', 'IN', 'AU', 'CA'];
            let parsedPhone = null;
            
            for (const country of countries) {
              try {
                parsedPhone = parsePhoneNumber(rawPhone, country);
                if (parsedPhone && parsedPhone.isValid()) {
                  // Format as international number
                  structured.phone = parsedPhone.formatInternational();
                  break;
                }
              } catch (e) {
                continue;
              }
            }
            
            // If no valid parse, use cleaned raw phone
            if (!structured.phone) {
              structured.phone = rawPhone.replace(/[\s\-\(\)\.]/g, '');
            }
            break;
          } catch (error) {
            // Fallback to simple cleaning
            structured.phone = rawPhone.replace(/[\s\-\(\)\.]/g, '');
            break;
          }
        }
      }

      // Enhanced location/address extraction - prioritize explicit address lines
      let explicitAddress = '';
      for (let i = 0; i < Math.min(20, lines.length); i++) {
        const line = lines[i];
        const lineLower = line.toLowerCase();
        
        // Look for explicit address label
        if (lineLower.startsWith('address:') || lineLower.includes('address:')) {
          explicitAddress = line.replace(/address:/gi, '').trim();
          
          // Parse address components
          const parts = explicitAddress.split(',').map(p => p.trim()).filter(p => p.length > 0);
          
          if (parts.length > 0) {
            structured.address = explicitAddress;
            
            // Extract postal code (UK format: XX# #XX or US format: ##### or #####-####)
            const postcodeMatch = explicitAddress.match(/([A-Z]{1,2}\d{1,2}\s?\d[A-Z]{2}|\d{5}(-\d{4})?)/i);
            
            // City is typically the part before the postal code
            if (parts.length >= 2) {
              // Find the part with postal code
              let postcodePartIndex = -1;
              if (postcodeMatch) {
                postcodePartIndex = parts.findIndex(p => p.includes(postcodeMatch[0]));
              }
              
              if (postcodePartIndex > 0) {
                // City is the part before postal code
                structured.city = parts[postcodePartIndex - 1];
              } else {
                // Fallback: second-to-last part is usually city
                structured.city = parts[parts.length - 2] || parts[0];
              }
              
              // Country is typically the last part or inferred
              const lastPart = parts[parts.length - 1];
              // Check if last part looks like a postcode (UK format: letters and numbers)
              const isPostcode = /^[A-Z]{1,2}\d{1,2}\s?\d[A-Z]{2}\.?$/i.test(lastPart.trim());
              
              if (isPostcode || lastPart.length > 15) {
                // Last part is postal code, try to infer country from phone or institution
                // For now, leave empty (better than wrong data)
                structured.country = '';
              } else {
                structured.country = lastPart;
              }
            }
          }
          break;
        }
      }
      
      // If no explicit address found, use NLP
      if (!explicitAddress) {
        const locationDoc = compromise(text);
        const places = locationDoc.places().out('array');
        
        if (places && places.length > 0) {
          // Clean and deduplicate places
          const uniquePlaces = [...new Set(places.map(p => p.trim()))];
          const cleanedPlaces = uniquePlaces.filter(p => p.length > 2 && p.length < 50);
          
          // Try to identify city and country (avoid duplicates)
          const locationParts = new Set();
          for (const place of cleanedPlaces) {
            // Split by comma and add each part
            const parts = place.split(',').map(p => p.trim()).filter(p => p.length > 0);
            parts.forEach(part => locationParts.add(part));
          }
          
          const uniqueLocationParts = Array.from(locationParts);
          
          // Assign city and country (last one is usually country, first is city)
          if (uniqueLocationParts.length > 0) {
            if (uniqueLocationParts.length === 1) {
              // If only one location, it's likely the country
              structured.country = uniqueLocationParts[0];
            } else {
              // Multiple locations: first is city, last is country
              structured.city = uniqueLocationParts[0];
              structured.country = uniqueLocationParts[uniqueLocationParts.length - 1];
            }
            
            // Build address from unique parts
            structured.address = uniqueLocationParts.join(', ');
          }
        }
      }
      
      // Fallback: Extract address information using keywords
      if (!structured.address) {
        const addressKeywords = ['address', 'location', 'province', 'city', 'country'];
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].toLowerCase();
          if (addressKeywords.some(keyword => line.includes(keyword))) {
            // Look for address in the same line or next few lines
            for (let j = i; j < Math.min(i + 3, lines.length); j++) {
              const addressLine = lines[j];
              if (addressLine.includes(',') && addressLine.length > 10) {
                structured.address = addressLine;
                const addressParts = addressLine.split(',').map(p => p.trim()).filter(p => p.length > 0);
                
                // Remove duplicates from address parts
                const uniqueAddressParts = [...new Set(addressParts)];
                
                if (uniqueAddressParts.length >= 2) {
                  if (!structured.city) structured.city = uniqueAddressParts[0];
                  if (!structured.country) structured.country = uniqueAddressParts[uniqueAddressParts.length - 1];
                } else if (uniqueAddressParts.length === 1) {
                  if (!structured.country) structured.country = uniqueAddressParts[0];
                }
                
                // Rebuild address without duplicates
                structured.address = uniqueAddressParts.join(', ');
                break;
              }
            }
            break;
          }
        }
      }

      // Enhanced education information extraction - support multiple entries
      const educationLevels = {
        'PhD': ['phd', 'ph.d', 'doctor of philosophy', 'doctorate', 'doctoral'],
        'Masters': ['master', 'msc', 'm.sc', 'ma', 'm.a', 'mba', 'm.b.a', 'meng', 'm.eng'],
        'Bachelors': ['bachelor', 'bsc', 'b.sc', 'ba', 'b.a', 'beng', 'b.eng', 'btech', 'b.tech', 'bit', 'b.it'],
        'Diploma': ['diploma', 'associate'],
        'Certificate': ['certificate', 'certification']
      };
      
      const qualificationKeywords = ['a-level', 'a level', 'o-level', 'o level', 'g.c.e', 'gce', 'advanced level', 'ordinary level'];
      const educationKeywords = ['education', 'academic background', 'qualifications'];
      const textLower = text.toLowerCase();
      
      // Find education section
      let inEducationSection = false;
      let educationSectionLines = [];
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const lineLower = line.toLowerCase();
        
        // Check if we're entering education section
        if (educationKeywords.some(keyword => lineLower === keyword)) {
          inEducationSection = true;
          continue;
        }
        
        // Collect education section lines
        if (inEducationSection && line.length > 0) {
          // Stop at next major section
          if (lineLower === 'technical skills' || lineLower === 'skills' || 
              lineLower === 'work experience' || lineLower === 'projects' ||
              lineLower === 'certifications' || lineLower === 'awards' ||
              lineLower === 'soft skills' || lineLower === 'strengths' ||
              lineLower === 'references') {
            break;
          }
          educationSectionLines.push(line);
        }
      }
      
      // Extract ALL education entries (degrees and qualifications)
      const educationEntries = [];
      let currentEntry = null;
      
      for (let i = 0; i < educationSectionLines.length; i++) {
        const line = educationSectionLines[i];
        const lineLower = line.toLowerCase();
        
        // Skip lines that are clearly job responsibilities (bullets, action verbs)
        const firstChar = line.charCodeAt(0);
        const isBulletPoint = firstChar === 8226 ||  // •
                              firstChar === 9675 ||  // ○
                              firstChar === 9679 ||  // ●
                              firstChar === 10146 || // Specific PDF bullet (Γ₧ó)
                              firstChar === 10070 || // Another PDF bullet (Γ¥û)
                              line.trim().startsWith('•') || 
                              line.trim().startsWith('-') || 
                              line.trim().startsWith('*') ||
                              /^[▪▫‣⦾⦿○●]/.test(line.trim());
        
        // Clean the line for checking (remove bullets)
        let cleanLine = line;
        if (isBulletPoint) {
          cleanLine = line.substring(1).trim();
        }
        const cleanLineLower = cleanLine.toLowerCase();
        
        // Check if this is a degree line FIRST (need this for bullet filtering)
        const isDegree = (lineLower.includes('bachelor') || lineLower.includes('master') || 
                         lineLower.includes('phd') || lineLower.includes('diploma') || 
                         lineLower.includes('bit') || lineLower.includes('b.it') ||
                         lineLower.includes('bsc') || lineLower.includes('b.sc') || 
                         lineLower.includes('msc') || lineLower.includes('m.sc') ||
                         lineLower.includes('ba') || lineLower.includes('b.a') ||
                         lineLower.includes('ma') || lineLower.includes('m.a') ||
                         lineLower.includes('mba') || lineLower.includes('m.b.a') ||
                         (lineLower.includes('science') && lineLower.includes('in'))) &&  // "Science in Computing" but not "School of Computing"
                        !lineLower.includes('major:'); // Exclude "Major:" lines
        
        // Skip job titles and companies (they contain | or job indicators)
        const isJobTitle = line.includes('|') || 
                          lineLower.includes('engineer') || 
                          lineLower.includes('administrator') ||
                          lineLower.includes('coordinator') ||
                          lineLower.includes('assistant') ||
                          lineLower.includes('manager');
        
        const isCompanyLine = lineLower.includes('(pvt)') || 
                             lineLower.includes('ltd') ||
                             lineLower.includes('pvt ltd') ||
                             lineLower.includes('com ltd');
        
        // Check job responsibilities using CLEANED line (after bullet removal)
        const isJobResponsibility = cleanLineLower.startsWith('ensure') || cleanLineLower.startsWith('prepare') ||
                                   cleanLineLower.startsWith('evaluate') || cleanLineLower.startsWith('monitor') ||
                                   cleanLineLower.startsWith('solution') || cleanLineLower.startsWith('establish') ||
                                   cleanLineLower.startsWith('upgrade') || cleanLineLower.startsWith('addend') ||
                                   cleanLineLower.startsWith('attend') || cleanLineLower.startsWith('implement') ||
                                   cleanLineLower.startsWith('define') || cleanLineLower.startsWith('staff');
        
        // Skip non-education content
        const isProjectLine = cleanLineLower.includes('project name:') || cleanLineLower.startsWith('project name') ||
                             cleanLineLower.startsWith('o full') || cleanLineLower.startsWith('o sophisticated') ||
                             cleanLineLower.startsWith('o fiber') || cleanLineLower.startsWith('o evaluate') ||
                             cleanLineLower.startsWith('o increase');
        
        const isDeclarationOrReference = cleanLineLower.includes('hereby declare') || 
                                        lineLower.includes('email:') ||  // Check original line
                                        cleanLineLower.includes('managing director') ||
                                        cleanLineLower.includes('chairman') ||
                                        cleanLineLower.includes('ambagahawatta') ||  // Specific reference name
                                        (lineLower.includes('@') && !isDegree) ||  // Check original line
                                        cleanLineLower.includes(' it related') ||  // "other IT related services"
                                        cleanLineLower.includes('largest') ||  // "largest karting circuit"
                                        line.length > 100 ||  // Very long lines are usually descriptions, not degrees
                                        (!isDegree && line.split(/\s+/).length === 2 && /^[A-Z][a-z]+\s[A-Z][a-z]+$/.test(line.trim()));  // Just a name (e.g., "Chamilka Ambagahawatta")
        
        // Check if this is an institution line (but don't filter it out yet - we need it for association)
        const isInstitution = (lineLower.includes('university') || lineLower.includes('college') || 
                              lineLower.includes('institute') || lineLower.includes('school') ||
                              lineLower.includes('studies') || lineLower.includes('academy')) &&
                              !lineLower.includes('high school') && !lineLower.includes('vidyalaya') &&
                              !isDegree; // Institution name without degree
        
        // Skip bullet points that aren't degrees
        if (isBulletPoint && !isDegree) {
          continue;
        }
        
        // Skip various non-education content, but NOT institutions (we need them for association)
        if (isJobTitle || isCompanyLine || isJobResponsibility || isProjectLine || 
            isDeclarationOrReference) {
          continue; // Skip this line
        }
        
        // Check if this is a qualification (A-Level, O-Level)
        const isQualification = qualificationKeywords.some(keyword => lineLower.includes(keyword));
        
        // IMPORTANT: Check isQualification FIRST because a line can match both
        // (e.g., "G.C.E Advanced Level" matches both isDegree and isQualification)
        if (isQualification) {
          // Handle A-Level, O-Level as separate entry or qualification
          if (currentEntry && currentEntry.degree) {
            educationEntries.push(currentEntry);
          }
          
          // Extract institution from the same line if present (e.g., "G.C.E Advanced Level – Panadura Balika Maha Vidyalaya")
          let degreePart = line;
          let institutionPart = '';
          
          // Split on various dash characters: hyphen (\u002D), en dash (\u2013), em dash (\u2014)
          // Use regex to split on any dash with optional surrounding whitespace
          const dashRegex = /\s*[\u002D\u2013\u2014]\s*/;
          if (dashRegex.test(line)) {
            const parts = line.split(dashRegex);
            if (parts.length >= 2) {
              degreePart = parts[0].trim();
              institutionPart = parts.slice(1).join(' ').trim();
            }
          }
          
          currentEntry = {
            degree: degreePart,
            institution: institutionPart,
            graduationYear: '',
            gpa: ''
          };
          
          // If institution wasn't found in the same line, check next line
          if (!institutionPart && i + 1 < educationSectionLines.length) {
            const nextLine = educationSectionLines[i + 1];
            if (nextLine.toLowerCase().includes('school') || nextLine.toLowerCase().includes('college') || 
                nextLine.toLowerCase().includes('vidyalaya')) {
              currentEntry.institution = nextLine;
              i++; // Skip next line
            }
          }
        } else if (isDegree) {
          // Start a new education entry
          if (currentEntry && currentEntry.degree) {
            educationEntries.push(currentEntry);
          }
          
          // Clean bullet characters from degree line
          let cleanDegree = line;
          const firstChar = line.charCodeAt(0);
          if (firstChar === 8226 || firstChar === 9675 || firstChar === 9679 || 
              firstChar === 10146 || firstChar === 10070) {
            // Remove the bullet character and any following whitespace
            cleanDegree = line.substring(1).trim();
          }
          
          currentEntry = {
            degree: cleanDegree,
            institution: '',
            graduationYear: '',
            gpa: ''
          };
          
          // Extract year from degree line if present (prefer end year for graduation)
          if (line.match(/20\d{2}|19\d{2}/)) {
            const dates = chrono.parse(line);
            if (dates && dates.length > 0) {
              const lastDate = dates[dates.length - 1];
              // If there's an end date (date range), use that as graduation year
              // Otherwise use the start date
              let year = lastDate.end ? lastDate.end.get('year') : lastDate.start.get('year');
              if (year && year >= 1990 && year <= new Date().getFullYear() + 5) {
                currentEntry.graduationYear = year.toString();
              }
            }
          }
        } else if (isInstitution && currentEntry) {
          // Add institution to current entry
          currentEntry.institution = line;
          
          // Extract year from institution line if not already found (prefer end year)
          if (!currentEntry.graduationYear && line.match(/20\d{2}|19\d{2}/)) {
            const dates = chrono.parse(line);
            if (dates && dates.length > 0) {
              const lastDate = dates[dates.length - 1];
              // If there's an end date (date range), use that as graduation year
              let year = lastDate.end ? lastDate.end.get('year') : lastDate.start.get('year');
              if (year && year >= 1990 && year <= new Date().getFullYear() + 5) {
                currentEntry.graduationYear = year.toString();
              }
            }
          }
        }
      }
      
      // Add the last entry
      if (currentEntry && currentEntry.degree) {
        educationEntries.push(currentEntry);
      }
      
      // Populate structured data
      if (educationEntries.length > 0) {
        // Set first entry to single fields (for backward compatibility)
        structured.degree = educationEntries[0].degree;
        structured.institution = educationEntries[0].institution;
        structured.graduationYear = educationEntries[0].graduationYear;
        
        // Set all entries to education array
        structured.education = educationEntries;
        
        // Infer country from institution names if country is not set or looks like a postcode
        if (!structured.country || /^[A-Z]{1,2}\d{1,2}\s?\d[A-Z]{2}\.?$/i.test(structured.country)) {
          // Look through all institutions for country names
          for (const entry of educationEntries) {
            if (entry.institution) {
              const instLower = entry.institution.toLowerCase();
              // Check for common country patterns in institution names
              if (instLower.includes('united kingdom') || instLower.includes('uk')) {
                structured.country = 'United Kingdom';
                break;
              } else if (instLower.includes('sri lanka')) {
                structured.country = 'Sri Lanka';
                break;
              } else if (instLower.includes('usa') || instLower.includes('united states')) {
                structured.country = 'United States';
                break;
              } else if (instLower.includes('australia')) {
                structured.country = 'Australia';
                break;
              } else if (instLower.includes('canada')) {
                structured.country = 'Canada';
                break;
              } else if (instLower.includes('india')) {
                structured.country = 'India';
                break;
              }
            }
          }
        }
        
        // Detect education level from first degree
        const degreeLower = educationEntries[0].degree.toLowerCase();
        // Check in order of specificity: PhD > Masters > Bachelors > Diploma > Certificate
        // Use word boundaries to avoid false matches (e.g., "bachelor" should not match "master")
        for (const [level, keywords] of Object.entries(educationLevels)) {
          let matched = false;
          for (const keyword of keywords) {
            // Use word boundary regex to ensure exact word match
            const regex = new RegExp(`\\b${keyword}\\b`, 'i');
            if (regex.test(degreeLower)) {
              structured.educationLevel = level;
              matched = true;
              break;
            }
          }
          if (matched) break;
        }
      }
      
      // Fallback: search entire text if education section wasn't found
      if (educationEntries.length === 0) {
        for (const [level, keywords] of Object.entries(educationLevels)) {
          for (const keyword of keywords) {
            if (textLower.includes(keyword)) {
              if (!structured.educationLevel) {
                structured.educationLevel = level;
              }
              // Find the line containing the keyword
              for (const line of lines) {
                if (line.toLowerCase().includes(keyword) && !structured.degree) {
                  structured.degree = line.trim();
                  break;
                }
              }
            }
          }
        }
        
        // Find institution
        for (const line of lines) {
          const lineLower = line.toLowerCase();
          if ((lineLower.includes('university') || lineLower.includes('college') || lineLower.includes('institute')) 
              && !structured.institution && line.length < 100) {
            structured.institution = line.trim();
            break;
          }
        }
      }
      
      // Fallback graduation year extraction if not found
      if (!structured.graduationYear) {
        const yearRegex = /(19|20)\d{2}/g;
        const yearMatches = text.match(yearRegex);
        if (yearMatches && yearMatches.length > 0) {
          const years = yearMatches.map(y => parseInt(y))
            .filter(y => y >= 1990 && y <= new Date().getFullYear() + 5)
            .sort((a, b) => b - a);
          
          if (years.length > 0) {
            // Try to find a year near education keywords
            for (const keyword of ['education', 'degree', 'graduated', 'university', 'college']) {
              const keywordIndex = textLower.indexOf(keyword);
              if (keywordIndex !== -1) {
                const contextText = text.substring(Math.max(0, keywordIndex - 100), Math.min(text.length, keywordIndex + 200));
                const contextYears = contextText.match(yearRegex);
                if (contextYears && contextYears.length > 0) {
                  structured.graduationYear = contextYears[contextYears.length - 1]; // Last year is usually graduation
                  break;
                }
              }
            }
            
            // If still not found, use most recent year
            if (!structured.graduationYear) {
              structured.graduationYear = years[0].toString();
            }
          }
        }
      }

      // Enhanced GPA extraction
      const gpaRegexes = [
        /GPA[:\s]*([0-9]+\.[0-9]+)/gi,
        /Grade[:\s]*([0-9]+\.[0-9]+)/gi,
        /([0-9]+\.[0-9]+)\s*\/\s*4\.0/gi,
        /([0-9]+\.[0-9]+)\s*\/\s*4/gi
      ];
      
      for (const regex of gpaRegexes) {
        const gpaMatch = text.match(regex);
        if (gpaMatch && gpaMatch.length > 0) {
          const gpaValue = gpaMatch[0].match(/([0-9]+\.[0-9]+)/);
          if (gpaValue) {
            structured.gpa = gpaValue[1];
            break;
          }
        }
      }

      // Enhanced IELTS score extraction
      const ieltsRegexes = [
        /IELTS[:\s]*([0-9]+\.[0-9])/gi,
        /IELTS[:\s]*([0-9])/gi,
        /([0-9]+\.[0-9])\s*IELTS/gi
      ];
      
      for (const regex of ieltsRegexes) {
        const ieltsMatch = text.match(regex);
        if (ieltsMatch && ieltsMatch.length > 0) {
          const score = ieltsMatch[0].match(/([0-9]+\.?[0-9]?)/);
          if (score) {
            structured.ieltsScore = score[1];
            break;
          }
        }
      }

      // Enhanced work experience and projects extraction
      const workKeywords = ['experience', 'experiences', 'employment', 'work history', 'projects', 'project'];
      let inWorkSection = false;
      let inProjectSection = false;
      const workExperiences = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const lineLower = line.toLowerCase();
        
        // Check if we're entering work/project section
        if (lineLower === 'work experience' || lineLower === 'work experiences' || lineLower.includes('employment')) {
          inWorkSection = true;
          inProjectSection = false;
          continue;
        }
        if (lineLower === 'projects' || lineLower === 'project') {
          inProjectSection = true;
          inWorkSection = false;
          continue;
        }

        // Skip false positives
        if (lineLower.includes('date of birth') || lineLower.includes('personal details') || lineLower.includes('contact')) {
          continue;
        }

        // Enhanced date parsing for various formats
        const parseDates = (text) => {
          const result = { startDate: '', endDate: '' };
          
          // Try chrono-node first for natural language dates
          const dates = chrono.parse(text);
          if (dates && dates.length > 0) {
            const firstDate = dates[0].start;
            if (firstDate) {
              const month = firstDate.get('month');
              const year = firstDate.get('year');
              if (month && year) {
                result.startDate = `${year}-${String(month).padStart(2, '0')}-01`;
              } else if (year) {
                result.startDate = `${year}-01-01`;
              }
            }
            
            // Check for end date
            if (dates[0].end) {
              const endDate = dates[0].end;
              const month = endDate.get('month');
              const year = endDate.get('year');
              if (month && year) {
                result.endDate = `${year}-${String(month).padStart(2, '0')}-01`;
              } else if (year) {
                result.endDate = `${year}-12-31`;
              }
            } else if (dates.length > 1) {
              const secondDate = dates[1].start;
              const month = secondDate.get('month');
              const year = secondDate.get('year');
              if (month && year) {
                result.endDate = `${year}-${String(month).padStart(2, '0')}-01`;
              } else if (year) {
                result.endDate = `${year}-12-31`;
              }
            }
          }
          
          // Check for "present", "current", "ongoing"
          if (/present|current|ongoing|now/i.test(text)) {
            result.endDate = new Date().toISOString().split('T')[0];
          }
          
          return result;
        };

        // Pattern 1: Multi-line format (Company on one line, position with "Worked as" next, date in parentheses after)
        // Example:
        // "Sri Shell Tech PVT LTD - Dematagoda"
        // "Worked as loan Recovery and Management System"
        // "(April 2022 - May 2023)"
        if (inWorkSection && line.length > 10 && i + 2 < lines.length) {
          const nextLine1 = lines[i + 1]?.trim() || '';
          const nextLine2 = lines[i + 2]?.trim() || '';
          
          // Check if this looks like a company name (contains location indicators or company suffixes)
          const isCompanyLine = (line.includes('LTD') || line.includes('Ltd') || line.includes('LLC') || 
                                 line.includes('Inc') || line.includes('PLC') || line.includes('PVT') ||
                                 (line.includes('-') && !line.includes('(') && line.length < 80));
          const hasWorkedAs = nextLine1.toLowerCase().includes('worked as');
          const hasDateInParens = nextLine2.match(/\(.*20\d{2}.*\)/);
          
          if (isCompanyLine && hasWorkedAs && hasDateInParens) {
            const company = line;
            const position = nextLine1.replace(/worked as\s*/i, '').trim();
            const dates = parseDates(nextLine2);
            
            if (position && dates.startDate) {
              workExperiences.push({
                company: company,
                position: position,
                startDate: dates.startDate,
                endDate: dates.endDate || new Date().toISOString().split('T')[0],
                description: ''
              });
              i += 2; // Skip the next 2 lines we just processed
              continue;
            }
          }
          
          // Alternative format: Position with "Worked as" contains date
          // "Worked as intern Software Engineer (July 2024 - January 2025)"
          if (hasWorkedAs && nextLine1.match(/\(.*20\d{2}.*\)/)) {
            const company = line;
            // Extract position and date from the "Worked as..." line
            const positionMatch = nextLine1.match(/worked as\s+(.+?)\s*\(/i);
            if (positionMatch) {
              const position = positionMatch[1].trim();
              const dates = parseDates(nextLine1);
              
              if (position && dates.startDate) {
                workExperiences.push({
                  company: company,
                  position: position,
                  startDate: dates.startDate,
                  endDate: dates.endDate || new Date().toISOString().split('T')[0],
                  description: ''
                });
                i += 1; // Skip the next line we just processed
                continue;
              }
            }
          }
        }

        // Pattern 2: "Position/Project Name    Date1 – Date2" on same line
        // This handles both work experience and projects with dates on the same line
        if ((inWorkSection || inProjectSection) && line.length > 10) {
          // Check if line contains a date range (e.g., "Oct 2023 – April 2024" or "Nov 2023 – Nov 2024")
          const dateRangePattern = /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+20\d{2}\s*[–\-—]\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+20\d{2}/i;
          
          if (dateRangePattern.test(line)) {
            // Extract the position/project name (everything before the date)
            const titleMatch = line.match(/^(.+?)\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i);
            if (titleMatch) {
              const position = titleMatch[1].trim();
              const dates = parseDates(line);
              
              // Get company name from next line if in work experience section
              let company = 'Not specified';
              if (inWorkSection && i + 1 < lines.length) {
                const nextLine = lines[i + 1].trim();
                // Check if next line is company name (not a bullet point or technology line)
                if (nextLine && !nextLine.startsWith('•') && !nextLine.startsWith('-') && nextLine.length < 100) {
                  company = nextLine;
                  i++; // Skip the next line since we used it
                }
              }
              
              if (position && dates.startDate) {
                workExperiences.push({
                  company: company,
                  position: position,
                  startDate: dates.startDate,
                  endDate: dates.endDate || new Date().toISOString().split('T')[0],
                  description: ''
                });
              }
            }
          }
        }

        // Stop at next major section
        if ((inWorkSection || inProjectSection) && (
          lineLower.includes('technical skills') || 
          lineLower.includes('strengths') ||
          lineLower === 'skills' ||
          lineLower === 'education' ||
          lineLower === 'personal profile'
        )) {
          inWorkSection = false;
          inProjectSection = false;
        }
      }

      structured.workExperience = workExperiences;

      // Enhanced skills extraction - ONLY from skills section
      const skillsKeywords = ['technical skills', 'skills', 'technologies used', 'technologies'];
      let inSkillsSection = false;
      const skills = [];
      let skillsSectionText = '';
      
      // Comprehensive tech skills database
      const techSkillsDatabase = [
        // Programming Languages
        'JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'C++', 'C', 'PHP', 'Ruby', 'Go', 'Swift', 'Kotlin', 'Rust', 'Scala', 'R', 'MATLAB',
        // Frontend
        'React', 'React.js', 'ReactJS', 'Angular', 'Vue.js', 'Vue', 'Svelte', 'Next.js', 'Nuxt.js', 'Gatsby', 'Remix',
        'HTML', 'HTML5', 'CSS', 'CSS3', 'SASS', 'SCSS', 'LESS', 'Bootstrap', 'Tailwind', 'Tailwind CSS', 'Material-UI', 'MUI', 'Ant Design', 'Chakra UI',
        'jQuery', 'Redux', 'MobX', 'Zustand', 'Webpack', 'Vite', 'Rollup', 'Parcel',
        // Backend
        'Node.js', 'Node', 'NodeJS', 'Express', 'Express.js', 'Nest.js', 'Fastify', 'Koa',
        'Django', 'Flask', 'FastAPI', 'Laravel', 'Symfony', 'CodeIgniter',
        'Spring', 'Spring Boot', 'Hibernate', 'ASP.NET', 'ASP.NET Core', '.NET Core', '.NET',
        'Ruby on Rails', 'Rails', 'PHP Laravel',
        // Mobile
        'React Native', 'Flutter', 'Ionic', 'Xamarin', 'Android', 'iOS', 'SwiftUI',
        // Databases
        'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'SQLite', 'Oracle', 'SQL Server', 'Microsoft SQL Server', 'MariaDB',
        'Cassandra', 'DynamoDB', 'Firebase', 'Firestore', 'Supabase', 'PlanetScale',
        'Elasticsearch', 'Neo4j', 'CouchDB',
        // Cloud & DevOps
        'AWS', 'Azure', 'Google Cloud', 'GCP', 'Heroku', 'Vercel', 'Netlify', 'DigitalOcean',
        'Docker', 'Kubernetes', 'K8s', 'Jenkins', 'CircleCI', 'Travis CI', 'GitHub Actions', 'GitLab CI',
        'Terraform', 'Ansible', 'Chef', 'Puppet', 'Vagrant',
        // Version Control
        'Git', 'GitHub', 'GitLab', 'Bitbucket', 'SVN',
        // APIs & Architecture
        'REST', 'REST API', 'RESTful', 'RESTful API', 'GraphQL', 'gRPC', 'WebSocket', 'Socket.io',
        'Microservices', 'Monolithic', 'Serverless', 'SOA', 'Event-Driven',
        // Testing
        'Jest', 'Mocha', 'Chai', 'Jasmine', 'Cypress', 'Selenium', 'Puppeteer', 'Playwright',
        'JUnit', 'TestNG', 'PyTest', 'PHPUnit', 'RSpec',
        // Methodologies
        'Agile', 'Scrum', 'Kanban', 'DevOps', 'CI/CD', 'TDD', 'BDD',
        // Data Science & ML
        'TensorFlow', 'PyTorch', 'Keras', 'Scikit-learn', 'Pandas', 'NumPy', 'Jupyter',
        'Machine Learning', 'Deep Learning', 'NLP', 'Computer Vision', 'AI',
        // Other
        'Linux', 'Unix', 'Windows', 'macOS',
        'Apache', 'Nginx', 'Tomcat',
        'JIRA', 'Confluence', 'Slack', 'Trello',
        'Figma', 'Adobe XD', 'Sketch', 'Photoshop', 'Illustrator',
        'Blockchain', 'FaceAPI', 'JWT', 'Hashing', 'Web Development', 'Database'
      ];
      
      // Extract ONLY the skills section text
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const lineLower = line.toLowerCase();
        
        // Check if we're entering skills section
        if (skillsKeywords.some(keyword => lineLower === keyword || lineLower.includes(keyword))) {
          inSkillsSection = true;
          continue;
        }

        // Collect skills section text
        if (inSkillsSection && line.length > 0) {
          // Stop at next major section
          if (lineLower === 'strengths' || lineLower === 'education' || 
              lineLower === 'awards' || lineLower === 'certifications' || 
              lineLower === 'work experience' || lineLower === 'projects') {
            break;
          }
          
          // Skip subsection headers
          if (lineLower.includes('client side') || lineLower.includes('server side') || 
              lineLower.includes('other development') || lineLower.includes('databases & tools')) {
            continue;
          }
          
          skillsSectionText += ' ' + line;
        }
      }

      // Extract skills from the skills section text only
      if (skillsSectionText.length > 0) {
        // Remove bullet points and clean up
        const cleanedText = skillsSectionText.replace(/[•\-]/g, ' ').replace(/\s+/g, ' ');
        
        // Match against tech skills database
        for (const skill of techSkillsDatabase) {
          const skillRegex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
          if (skillRegex.test(cleanedText) && !skills.includes(skill)) {
            skills.push(skill);
          }
        }
        
        // Also split by common separators and check each token
        const tokens = cleanedText.split(/[,;|•\n\t]/).map(s => s.trim()).filter(s => s.length > 1);
        for (const token of tokens) {
          const tokenClean = token.replace(/[()[\]{}]/g, '').trim();
          if (tokenClean.length < 2 || tokenClean.length > 30) continue;
          
          // Check if it matches any skill in database (case insensitive)
          const matchedSkill = techSkillsDatabase.find(skill => 
            skill.toLowerCase() === tokenClean.toLowerCase()
          );
          
          if (matchedSkill && !skills.includes(matchedSkill)) {
            skills.push(matchedSkill);
          }
        }
      }

      // Remove duplicates and clean up
      structured.skills = [...new Set(skills)];

      // Enhanced social links extraction using url-regex-safe
      try {
        const urlMatches = text.match(urlRegex({ strict: false }));
        if (urlMatches && urlMatches.length > 0) {
          // Filter and categorize URLs
          for (const url of urlMatches) {
            const lowerUrl = url.toLowerCase();
            
            // GitHub
            if (lowerUrl.includes('github.com') && !structured.githubUrl) {
              structured.githubUrl = url.startsWith('http') ? url : `https://${url}`;
            }
            // LinkedIn
            else if (lowerUrl.includes('linkedin.com') && !structured.linkedinUrl) {
              structured.linkedinUrl = url.startsWith('http') ? url : `https://${url}`;
            }
            // Portfolio (common portfolio domains)
            else if (!structured.portfolioUrl && 
                     (lowerUrl.includes('portfolio') || 
                      lowerUrl.includes('behance.com') || 
                      lowerUrl.includes('dribbble.com') ||
                      lowerUrl.includes('vercel.app') ||
                      lowerUrl.includes('netlify.app') ||
                      lowerUrl.includes('herokuapp.com') ||
                      lowerUrl.match(/[a-z0-9-]+\.(dev|me|io)$/))) {
              structured.portfolioUrl = url.startsWith('http') ? url : `https://${url}`;
            }
          }
        }
      } catch (error) {
        console.error('URL extraction error, falling back to regex:', error);
        
        // Fallback: Original regex patterns
        const githubRegex = /github\.com\/[a-zA-Z0-9\-_]+/g;
        const githubMatch = text.match(githubRegex);
        if (githubMatch && githubMatch.length > 0) {
          structured.githubUrl = 'https://' + githubMatch[0];
        }

        const linkedinRegex = /linkedin\.com\/in\/[a-zA-Z0-9\-_]+/g;
        const linkedinMatch = text.match(linkedinRegex);
        if (linkedinMatch && linkedinMatch.length > 0) {
          structured.linkedinUrl = 'https://' + linkedinMatch[0];
        }
      }

      // Clean up empty strings and null values
      Object.keys(structured).forEach(key => {
        if (structured[key] === null || structured[key] === undefined) {
          structured[key] = '';
        }
        if (Array.isArray(structured[key])) {
          // Only filter string arrays, not object arrays like workExperience, education, qualifications
          if (key === 'workExperience' || key === 'education' || key === 'qualifications') {
            // For object arrays, keep all valid objects
            structured[key] = structured[key].filter(item => item && typeof item === 'object');
          } else if (key === 'skills') {
            // For skills, filter string items
            structured[key] = structured[key].filter(item => item && typeof item === 'string' && item.trim() !== '');
          } else {
            // For other arrays, filter string items
            structured[key] = structured[key].filter(item => item && typeof item === 'string' && item.trim() !== '');
          }
        }
      });

      return structured;

    } catch (error) {
      console.error('Error structuring extracted data:', error);
      return structured; // Return empty structure if parsing fails
    }
  }

  /**
   * Validate extracted data
   * @param {Object} data - Extracted data
   * @returns {Object} Validation result
   */
  static validateExtractedData(data) {
    const errors = [];
    const warnings = [];

    // Check for required fields
    if (!data.firstName && !data.lastName) {
      warnings.push('No name information found');
    }

    if (!data.email) {
      warnings.push('No email address found');
    }

    if (!data.phone) {
      warnings.push('No phone number found');
    }

    if (!data.institution && !data.degree) {
      warnings.push('No education information found');
    }

    if (!data.workExperience || data.workExperience.length === 0) {
      warnings.push('No work experience found');
    }

    if (!data.skills || data.skills.length === 0) {
      warnings.push('No skills information found');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get supported file types
   * @returns {Array} Array of supported file extensions
   */
  static getSupportedFileTypes() {
    return ['.pdf', '.docx'];
  }

  /**
   * Get maximum file size
   * @returns {number} Maximum file size in bytes
   */
  static getMaxFileSize() {
    return 10 * 1024 * 1024; // 10MB
  }
}

module.exports = CVExtractionService;
