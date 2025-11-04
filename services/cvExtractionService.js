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
      
      // Education Details
      degree: '',
      institution: '',
      graduationYear: '',
      gpa: '',
      ieltsScore: '',
      englishLevel: '',
      
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

      // Enhanced name extraction using NLP
      const nameDoc = compromise(text);
      const people = nameDoc.people().out('array');
      
      if (people && people.length > 0) {
        // Take the first person name found
        const fullName = people[0];
        const nameParts = fullName.split(/\s+/);
        if (nameParts.length >= 2) {
          structured.firstName = nameParts[0];
          structured.lastName = nameParts.slice(1).join(' ');
        } else {
          structured.firstName = fullName;
        }
      }
      
      // Fallback: Look for name patterns in first few lines
      if (!structured.firstName) {
        for (let i = 0; i < Math.min(5, lines.length); i++) {
          const line = lines[i].trim();
          // Skip lines that look like contact info or headers
          if (line.includes('@') || line.includes('phone') || line.includes('email') || 
              line.includes('address') || line.includes('resume') || line.includes('cv') ||
              line.toLowerCase().includes('curriculum')) {
            continue;
          }
          
          // Look for name patterns (2-4 words, primarily letters)
          if (line.length > 3 && line.length < 50 && /^[A-Za-z\s\-\.]+$/.test(line)) {
            const nameParts = line.split(/\s+/);
            if (nameParts.length >= 2 && nameParts.length <= 4) {
              structured.firstName = nameParts[0];
              structured.lastName = nameParts.slice(1).join(' ');
              break;
            }
          }
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

      // Enhanced location/address extraction using NLP
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

      // Enhanced education information extraction using NLP
      const educationLevels = {
        'PhD': ['phd', 'ph.d', 'doctor of philosophy', 'doctorate', 'doctoral'],
        'Masters': ['master', 'msc', 'm.sc', 'ma', 'm.a', 'mba', 'm.b.a', 'meng', 'm.eng'],
        'Bachelors': ['bachelor', 'bsc', 'b.sc', 'ba', 'b.a', 'beng', 'b.eng', 'btech', 'b.tech'],
        'Diploma': ['diploma', 'associate'],
        'Certificate': ['certificate', 'certification']
      };
      
      const educationKeywords = ['education', 'degree', 'university', 'college', 'institute', 'qualification', 'academic'];
      const textLower = text.toLowerCase();
      
      // Detect education level
      for (const [level, keywords] of Object.entries(educationLevels)) {
        for (const keyword of keywords) {
          if (textLower.includes(keyword)) {
            structured.educationLevel = level;
            break;
          }
        }
        if (structured.educationLevel) break;
      }
      
      // Extract degree and institution
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].toLowerCase();
        if (educationKeywords.some(keyword => line.includes(keyword))) {
          // Look for degree and institution in nearby lines
          for (let j = i; j < Math.min(i + 5, lines.length); j++) {
            const eduLine = lines[j];
            if (eduLine.length > 5 && !eduLine.includes(':')) {
              // Check for degree
              if (!structured.degree && (
                eduLine.match(/bachelor|master|phd|doctorate|diploma|degree/i))) {
                structured.degree = eduLine.trim();
              }
              // Check for institution
              if (!structured.institution && (
                eduLine.match(/university|college|institute|school/i))) {
                structured.institution = eduLine.trim();
              }
            }
          }
          if (structured.degree && structured.institution) break;
        }
      }

      // Enhanced graduation year extraction using chrono-node
      const educationKeywordsForDate = ['graduated', 'degree', 'bachelor', 'master', 'phd', 'diploma', 'certificate', 'completed'];
      let graduationYearFound = false;
      
      // Use chrono to find dates near education keywords
      for (const keyword of educationKeywordsForDate) {
        const keywordIndex = text.toLowerCase().indexOf(keyword);
        if (keywordIndex !== -1) {
          const contextText = text.substring(Math.max(0, keywordIndex - 50), Math.min(text.length, keywordIndex + 100));
          const dates = chrono.parse(contextText);
          
          if (dates && dates.length > 0) {
            // Get the most recent date that makes sense for graduation
            for (const dateResult of dates) {
              const year = dateResult.start.get('year');
              if (year && year >= 1990 && year <= new Date().getFullYear() + 5) {
                structured.graduationYear = year.toString();
                graduationYearFound = true;
                break;
              }
            }
            if (graduationYearFound) break;
          }
        }
      }
      
      // Fallback: Basic year extraction if chrono didn't find it
      if (!structured.graduationYear) {
        const yearRegex = /(19|20)\d{2}/g;
        const yearMatches = text.match(yearRegex);
        if (yearMatches && yearMatches.length > 0) {
          const years = yearMatches.map(y => parseInt(y))
            .filter(y => y >= 1990 && y <= new Date().getFullYear())
            .sort((a, b) => b - a);
          
          if (years.length > 0) {
            structured.graduationYear = years[0].toString();
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
      const workKeywords = ['experience', 'employment', 'work history', 'projects', 'project'];
      let inWorkSection = false;
      let inProjectSection = false;
      const workExperiences = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const lineLower = line.toLowerCase();
        
        // Check if we're entering work/project section
        if (lineLower === 'work experience' || lineLower.includes('employment')) {
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

        // Pattern: "Position/Project Name    Date1 – Date2"
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
          lineLower === 'education'
        )) {
          inWorkSection = false;
          inProjectSection = false;
        }
      }

      structured.workExperience = workExperiences;

      // Enhanced skills extraction using NLP and TF-IDF
      const skillsKeywords = ['technical skills', 'skills', 'technologies', 'programming', 'languages', 'tools', 'expertise', 'competencies', 'proficient'];
      let inSkillsSection = false;
      const skills = [];
      
      // Comprehensive tech skills database
      const techSkillsDatabase = [
        // Programming Languages
        'JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'C++', 'C', 'PHP', 'Ruby', 'Go', 'Swift', 'Kotlin', 'Rust', 'Scala', 'R', 'MATLAB',
        // Frontend
        'React', 'Angular', 'Vue.js', 'Vue', 'Svelte', 'Next.js', 'Nuxt.js', 'Gatsby', 'Remix',
        'HTML', 'HTML5', 'CSS', 'CSS3', 'SASS', 'SCSS', 'LESS', 'Bootstrap', 'Tailwind CSS', 'Material-UI', 'Ant Design', 'Chakra UI',
        'jQuery', 'Redux', 'MobX', 'Zustand', 'Webpack', 'Vite', 'Rollup', 'Parcel',
        // Backend
        'Node.js', 'Express', 'Express.js', 'Nest.js', 'Fastify', 'Koa',
        'Django', 'Flask', 'FastAPI', 'Laravel', 'Symfony', 'CodeIgniter',
        'Spring', 'Spring Boot', 'Hibernate', 'ASP.NET', '.NET Core', '.NET',
        'Ruby on Rails', 'Rails',
        // Mobile
        'React Native', 'Flutter', 'Ionic', 'Xamarin', 'Android', 'iOS', 'SwiftUI',
        // Databases
        'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'SQLite', 'Oracle', 'SQL Server', 'MariaDB',
        'Cassandra', 'DynamoDB', 'Firebase', 'Firestore', 'Supabase', 'PlanetScale',
        'Elasticsearch', 'Neo4j', 'CouchDB',
        // Cloud & DevOps
        'AWS', 'Azure', 'Google Cloud', 'GCP', 'Heroku', 'Vercel', 'Netlify', 'DigitalOcean',
        'Docker', 'Kubernetes', 'K8s', 'Jenkins', 'CircleCI', 'Travis CI', 'GitHub Actions', 'GitLab CI',
        'Terraform', 'Ansible', 'Chef', 'Puppet', 'Vagrant',
        // Version Control
        'Git', 'GitHub', 'GitLab', 'Bitbucket', 'SVN',
        // APIs & Architecture
        'REST API', 'RESTful', 'GraphQL', 'gRPC', 'WebSocket', 'Socket.io',
        'Microservices', 'Monolithic', 'Serverless', 'SOA', 'Event-Driven',
        // Testing
        'Jest', 'Mocha', 'Chai', 'Jasmine', 'Cypress', 'Selenium', 'Puppeteer', 'Playwright',
        'JUnit', 'TestNG', 'PyTest', 'PHPUnit', 'RSpec',
        // Methodologies
        'Agile', 'Scrum', 'Kanban', 'DevOps', 'CI/CD', 'TDD', 'BDD',
        // Data Science & ML
        'TensorFlow', 'PyTorch', 'Keras', 'Scikit-learn', 'Pandas', 'NumPy', 'Jupyter',
        'Machine Learning', 'Deep Learning', 'NLP', 'Computer Vision',
        // Other
        'Linux', 'Unix', 'Windows', 'macOS',
        'Apache', 'Nginx', 'Tomcat',
        'JIRA', 'Confluence', 'Slack', 'Trello',
        'Figma', 'Adobe XD', 'Sketch', 'Photoshop', 'Illustrator'
      ];

      // Use compromise to identify technical terms and concepts
      const doc = compromise(text);
      const nouns = doc.nouns().out('array');
      
      // Extract skills from skills section
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].toLowerCase();
        
        if (skillsKeywords.some(keyword => line.includes(keyword))) {
          inSkillsSection = true;
          continue;
        }

        if (inSkillsSection && line.length > 2 && line.length < 200) {
          // Skip section headers
          if (line.includes('client side') || line.includes('server side') || line.includes('other development') ||
              line.includes('soft skills') || line.includes('personal skills')) {
            continue;
          }
          
          // Split by common separators
          const skillItems = line.split(/[,;|•\-\n\t]/).map(s => s.trim()).filter(s => s.length > 0);
          
          // Match against tech skills database
          for (const item of skillItems) {
            const itemClean = item.replace(/[()[\]{}]/g, '').trim();
            if (itemClean.length < 2) continue;
            
            const foundSkill = techSkillsDatabase.find(skill => 
              skill.toLowerCase() === itemClean.toLowerCase() ||
              itemClean.toLowerCase().includes(skill.toLowerCase()) ||
              skill.toLowerCase().includes(itemClean.toLowerCase())
            );
            
            if (foundSkill && !skills.includes(foundSkill)) {
              skills.push(foundSkill);
            } else if (itemClean.length > 2 && itemClean.length < 30 && !skills.includes(itemClean)) {
              // Add as-is if it looks like a skill
              const capitalizedSkill = itemClean.split(' ').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
              ).join(' ');
              skills.push(capitalizedSkill);
            }
          }
        }

        // Stop at next major section
        if (inSkillsSection && (line.includes('strengths') || line.includes('education') || 
            line.includes('awards') || line.includes('certifications') || line.includes('projects'))) {
          break;
        }
      }

      // Also search for skills throughout the entire document using TF-IDF
      const TfIdf = natural.TfIdf;
      const tfidf = new TfIdf();
      tfidf.addDocument(text);
      
      techSkillsDatabase.forEach(skill => {
        const score = tfidf.tfidf(skill, 0);
        if (score > 0.1 && !skills.includes(skill)) {
          // Verify the skill actually appears in the text
          if (text.toLowerCase().includes(skill.toLowerCase())) {
            skills.push(skill);
          }
        }
      });

      // Clean up skills and remove duplicates
      const cleanedSkills = skills
        .filter(skill => typeof skill === 'string' && skill.length > 1 && skill.length < 50)
        .map(skill => skill.replace(/[|•]/g, '').trim())
        .filter(skill => skill.length > 0)
        .map(skill => {
          // Capitalize first letter of each word for consistency
          return skill.split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          ).join(' ');
        });
      
      structured.skills = [...new Set(cleanedSkills)]; // Remove duplicates

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
          // Only filter string arrays, not object arrays like workExperience
          if (key === 'skills' || key === 'workExperience') {
            // For workExperience, keep all valid objects
            if (key === 'workExperience') {
              structured[key] = structured[key].filter(item => item && typeof item === 'object');
            } else {
              // For skills, filter string items
              structured[key] = structured[key].filter(item => item && typeof item === 'string' && item.trim() !== '');
            }
          } else {
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
