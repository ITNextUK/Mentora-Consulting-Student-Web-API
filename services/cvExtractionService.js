const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const path = require('path');
const fs = require('fs');

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
      github: '',
      linkedin: '',
      portfolio: ''
    };

    try {
      const text = rawData.text || '';
      const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

      // Enhanced name extraction - look for name patterns
      for (let i = 0; i < Math.min(5, lines.length); i++) {
        const line = lines[i].trim();
        // Skip lines that look like contact info or headers
        if (line.includes('@') || line.includes('phone') || line.includes('email') || 
            line.includes('address') || line.includes('resume') || line.includes('cv')) {
          continue;
        }
        
        // Look for name patterns (2-4 words, no special characters except hyphens)
        if (line.length > 3 && line.length < 50 && /^[A-Za-z\s\-\.]+$/.test(line)) {
          const nameParts = line.split(/\s+/);
          if (nameParts.length >= 2 && nameParts.length <= 4) {
            structured.firstName = nameParts[0];
            structured.lastName = nameParts.slice(1).join(' ');
            break;
          }
        }
      }

      // Enhanced email extraction with better regex
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const emailMatches = text.match(emailRegex);
      if (emailMatches && emailMatches.length > 0) {
        // Take the first valid email, prefer personal emails over company emails
        const personalEmail = emailMatches.find(email => 
          !email.includes('noreply') && 
          !email.includes('no-reply') && 
          !email.includes('admin@') &&
          !email.includes('info@')
        );
        structured.email = personalEmail || emailMatches[0];
      }

      // Enhanced phone number extraction - international formats
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
          structured.phone = phoneMatch[0].replace(/[\s\-\(\)\.]/g, '');
          break;
        }
      }

      // Extract address information
      const addressKeywords = ['address', 'location', 'province', 'city', 'country'];
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].toLowerCase();
        if (addressKeywords.some(keyword => line.includes(keyword))) {
          // Look for address in the same line or next few lines
          for (let j = i; j < Math.min(i + 3, lines.length); j++) {
            const addressLine = lines[j];
            if (addressLine.includes(',') && addressLine.length > 10) {
              structured.address = addressLine;
              const addressParts = addressLine.split(',');
          if (addressParts.length >= 2) {
            structured.city = addressParts[addressParts.length - 2]?.trim() || '';
            structured.country = addressParts[addressParts.length - 1]?.trim() || '';
          }
              break;
            }
          }
          break;
        }
      }

      // Extract education information
      const educationKeywords = ['education', 'degree', 'university', 'college', 'institute', 'bachelor', 'master', 'phd'];
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].toLowerCase();
        if (educationKeywords.some(keyword => line.includes(keyword))) {
          // Look for degree and institution in nearby lines
          for (let j = i; j < Math.min(i + 5, lines.length); j++) {
            const eduLine = lines[j];
            if (eduLine.length > 5 && !eduLine.includes(':')) {
              if (eduLine.includes('Bachelor') || eduLine.includes('Master') || eduLine.includes('Degree')) {
                structured.degree = eduLine;
              } else if (eduLine.includes('University') || eduLine.includes('College') || eduLine.includes('Institute')) {
                structured.institution = eduLine;
              }
            }
          }
          break;
        }
      }

      // Enhanced graduation year extraction
      const yearRegex = /(19|20)\d{2}/g;
      const yearMatches = text.match(yearRegex);
      if (yearMatches && yearMatches.length > 0) {
        // Filter years and find the most recent one that could be graduation year
        const years = yearMatches.map(y => parseInt(y))
          .filter(y => y >= 1990 && y <= new Date().getFullYear())
          .sort((a, b) => b - a); // Sort descending
        
        if (years.length > 0) {
          // Look for graduation-related keywords near the year
          const graduationKeywords = ['graduated', 'degree', 'bachelor', 'master', 'phd', 'diploma', 'certificate'];
          let graduationYear = years[0]; // Default to most recent year
          
          for (const year of years) {
            const yearIndex = text.indexOf(year.toString());
            if (yearIndex !== -1) {
              const context = text.substring(Math.max(0, yearIndex - 50), yearIndex + 50).toLowerCase();
              if (graduationKeywords.some(keyword => context.includes(keyword))) {
                graduationYear = year;
                break;
              }
            }
          }
          
          structured.graduationYear = graduationYear.toString();
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

      // Extract work experience and projects
      const workKeywords = ['experience', 'employment', 'work', 'job', 'position', 'company', 'projects', 'project'];
      let inWorkSection = false;
      const workExperiences = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].toLowerCase();
        
        if (workKeywords.some(keyword => line.includes(keyword))) {
          inWorkSection = true;
          continue;
        }

        if (inWorkSection && line.length > 10) {
          // Look for project patterns (Project Name | Company (Date))
          if (line.includes('|') && line.includes('(') && line.includes(')')) {
            const parts = line.split('|');
            if (parts.length >= 2) {
              const projectName = parts[0]?.trim() || '';
              const companyAndDate = parts[1]?.trim() || '';
              
              // Extract date from parentheses
              const dateMatch = companyAndDate.match(/\(([^)]+)\)/);
              const date = dateMatch ? dateMatch[1] : '';
              
              // Extract company name (remove date part)
              const company = companyAndDate.replace(/\([^)]+\)/, '').trim();
              
              workExperiences.push({
                company: company,
                position: projectName,
                startDate: date,
                endDate: '',
                description: ''
              });
            }
          }
          // Look for traditional work experience patterns
          else if (line.includes(' at ') || line.includes(' - ') || line.includes(' | ')) {
            const parts = line.split(/ at | - | \| /);
            if (parts.length >= 2) {
              workExperiences.push({
                company: parts[1]?.trim() || '',
                position: parts[0]?.trim() || '',
                startDate: '',
                endDate: '',
                description: ''
              });
            }
          }
        }

        // Stop at next major section
        if (inWorkSection && (line.includes('technical skills') || line.includes('education') || line.includes('strengths'))) {
          break;
        }
      }

      structured.workExperience = workExperiences;

      // Enhanced skills extraction
      const skillsKeywords = ['technical skills', 'skills', 'technologies', 'programming', 'languages', 'tools', 'expertise', 'competencies'];
      let inSkillsSection = false;
      const skills = [];
      const commonTechSkills = [
        'JavaScript', 'Python', 'Java', 'C#', 'C++', 'PHP', 'Ruby', 'Go', 'Swift', 'Kotlin',
        'React', 'Angular', 'Vue.js', 'Node.js', 'Express', 'Django', 'Flask', 'Laravel', 'Spring',
        'HTML', 'CSS', 'SASS', 'LESS', 'Bootstrap', 'Tailwind', 'Material-UI',
        'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'SQLite', 'Oracle',
        'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 'Jenkins', 'Git',
        'REST API', 'GraphQL', 'Microservices', 'Agile', 'Scrum', 'DevOps'
      ];

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
          
          // Check if any common tech skills are mentioned
          for (const item of skillItems) {
            const itemLower = item.toLowerCase();
            const foundSkill = commonTechSkills.find(skill => 
              skill.toLowerCase().includes(itemLower) || itemLower.includes(skill.toLowerCase())
            );
            
            if (foundSkill) {
              skills.push(foundSkill);
            } else if (item.length > 1 && item.length < 50 && /^[A-Za-z0-9\s\-\+\.]+$/.test(item)) {
              skills.push(item);
            }
          }
        }

        // Stop at next major section
        if (inSkillsSection && (line.includes('strengths') || line.includes('education') || 
            line.includes('awards') || line.includes('certifications') || line.includes('projects'))) {
          break;
        }
      }

      // Also search for skills throughout the entire document
      for (const skill of commonTechSkills) {
        if (text.toLowerCase().includes(skill.toLowerCase()) && !skills.includes(skill)) {
          skills.push(skill);
        }
      }

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

      // Extract social links
      const githubRegex = /github\.com\/[a-zA-Z0-9\-_]+/g;
      const githubMatch = text.match(githubRegex);
      if (githubMatch && githubMatch.length > 0) {
        structured.github = 'https://' + githubMatch[0];
      }

      const linkedinRegex = /linkedin\.com\/in\/[a-zA-Z0-9\-_]+/g;
      const linkedinMatch = text.match(linkedinRegex);
      if (linkedinMatch && linkedinMatch.length > 0) {
        structured.linkedin = 'https://' + linkedinMatch[0];
      }

      const portfolioRegex = /(portfolio|website|personal).*?https?:\/\/[^\s]+/gi;
      const portfolioMatch = text.match(portfolioRegex);
      if (portfolioMatch && portfolioMatch.length > 0) {
        const urlMatch = portfolioMatch[0].match(/https?:\/\/[^\s]+/);
        if (urlMatch) {
          structured.portfolio = urlMatch[0];
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
