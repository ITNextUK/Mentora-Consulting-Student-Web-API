const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const logger = require('../utils/logger');

class CVExtractionService {
  /**
   * Extract text from PDF file
   */
  static async extractFromPDF(filePath) {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      return data.text;
    } catch (error) {
      logger.error('PDF extraction error:', error);
      throw new Error('Failed to extract text from PDF');
    }
  }

  /**
   * Extract text from DOC/DOCX file
   */
  static async extractFromWord(filePath) {
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    } catch (error) {
      logger.error('Word extraction error:', error);
      throw new Error('Failed to extract text from Word document');
    }
  }

  /**
   * Extract text from CV file based on type
   */
  static async extractText(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    
    if (ext === '.pdf') {
      return await this.extractFromPDF(filePath);
    } else if (ext === '.doc' || ext === '.docx') {
      return await this.extractFromWord(filePath);
    } else {
      throw new Error('Unsupported file format');
    }
  }

  /**
   * Parse extracted text and structure data
   */
  static async parseCV(text) {
    // Enhanced parsing logic with regex patterns
    const data = {
      personalInfo: {},
      education: [],
      workExperience: [],
      skills: [],
      references: {}
    };

    // Extract email
    const emailRegex = /[\w\.-]+@[\w\.-]+\.\w+/gi;
    const emails = text.match(emailRegex);
    if (emails && emails.length > 0) {
      data.personalInfo.email = emails[0];
    }

    // Extract phone
    const phoneRegex = /(?:\+\d{1,3}[-.\s]?)?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g;
    const phones = text.match(phoneRegex);
    if (phones && phones.length > 0) {
      data.personalInfo.phone = phones[0].replace(/\s+/g, '');
    }

    // Extract GitHub
    const githubRegex = /github\.com\/[\w-]+/gi;
    const github = text.match(githubRegex);
    if (github && github.length > 0) {
      data.references.github = `https://${github[0]}`;
    }

    // Extract LinkedIn
    const linkedinRegex = /linkedin\.com\/in\/[\w-]+/gi;
    const linkedin = text.match(linkedinRegex);
    if (linkedin && linkedin.length > 0) {
      data.references.linkedin = `https://${linkedin[0]}`;
    }

    // Extract skills (common programming and soft skills)
    const skillsKeywords = [
      'JavaScript', 'TypeScript', 'Python', 'Java', 'C\\+\\+', 'C#',
      'React', 'Node\\.js', 'Angular', 'Vue', 'Express',
      'SQL', 'MongoDB', 'PostgreSQL', 'MySQL',
      'Git', 'Docker', 'Kubernetes', 'AWS', 'Azure',
      'HTML', 'CSS', 'REST', 'GraphQL', 'API',
      'Leadership', 'Communication', 'Teamwork', 'Problem Solving'
    ];

    skillsKeywords.forEach(skill => {
      const regex = new RegExp(skill, 'gi');
      if (regex.test(text)) {
        // Normalize skill name
        const normalizedSkill = skill.replace(/\\/g, '');
        if (!data.skills.includes(normalizedSkill)) {
          data.skills.push(normalizedSkill);
        }
      }
    });

    // Extract education (looking for degree keywords and years)
    const educationKeywords = ['Bachelor', 'Master', 'PhD', 'Diploma', 'BSc', 'MSc', 'BA', 'MA'];
    const lines = text.split('\n');
    
    lines.forEach((line, index) => {
      educationKeywords.forEach(keyword => {
        if (line.includes(keyword)) {
          // Try to find year in this line or nearby lines
          const yearRegex = /\b(19|20)\d{2}\b/g;
          const contextLines = lines.slice(Math.max(0, index - 2), index + 3).join(' ');
          const years = contextLines.match(yearRegex);
          
          const education = {
            degree: line.trim(),
            institution: '',
            graduationYear: years ? parseInt(years[years.length - 1]) : null
          };
          
          // Try to find institution name in nearby lines
          if (index + 1 < lines.length) {
            education.institution = lines[index + 1].trim();
          }
          
          data.education.push(education);
        }
      });
    });

    // Extract work experience (looking for job titles and companies)
    const workKeywords = ['Developer', 'Engineer', 'Manager', 'Analyst', 'Consultant', 'Intern'];
    
    lines.forEach((line, index) => {
      workKeywords.forEach(keyword => {
        if (line.includes(keyword)) {
          const yearRegex = /\b(19|20)\d{2}\b/g;
          const contextLines = lines.slice(Math.max(0, index - 1), index + 3).join(' ');
          const years = contextLines.match(yearRegex);
          
          const work = {
            title: line.trim(),
            company: index + 1 < lines.length ? lines[index + 1].trim() : '',
            startDate: years && years.length > 0 ? years[0] : '',
            endDate: years && years.length > 1 ? years[1] : 'Present',
            description: index + 2 < lines.length ? lines[index + 2].trim() : ''
          };
          
          data.workExperience.push(work);
        }
      });
    });

    return data;
  }

  /**
   * Main method to extract and parse CV data
   */
  static async extractCvData(filePath) {
    try {
      logger.info(`Starting CV extraction for: ${filePath}`);
      
      // Extract text from file
      const text = await this.extractText(filePath);
      
      if (!text || text.trim().length === 0) {
        throw new Error('No text content found in CV');
      }

      // Parse the extracted text
      const parsedData = await this.parseCV(text);
      
      logger.info('CV extraction completed successfully');
      return {
        success: true,
        data: parsedData,
        rawText: text
      };
    } catch (error) {
      logger.error('CV extraction failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = CVExtractionService;
