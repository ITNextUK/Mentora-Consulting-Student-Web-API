# CV Extraction & University Finder Analysis

## Overview
This document analyzes how CV extraction and university finder work in **Project-Mentora-Core** (employee dashboard) and how they can be applied to **Mentora-Consulting-Student-Web-Core** (student portal).

---

## 1. CV Extraction System

### 1.1 Architecture (Project-Mentora-API)

#### **Frontend Flow** (`StudentCreation.js`)
```javascript
// Step 1: Student uploads CV file
const handleCvFileSelect = (event) => {
  const file = event.target.files[0];
  // Validates: PDF/DOCX, max 10MB
  setCvFile(file);
};

// Step 2: Upload CV to server
const handleCvUpload = async () => {
  // Upload file
  const uploadResponse = await uploadCv(cvFile);
  // Returns: { fileId, filePath }
  
  // Extract data from uploaded CV
  const extractionResponse = await extractCvData(uploadResponse.data.fileId);
  
  // Auto-fill form with extracted data
  autoFillFormFromCv(extractionResponse.data);
};
```

#### **Backend Flow** (`studentController.js` + `cvExtractionService.js`)

**1. Upload Endpoint** (`POST /upload-cv`)
```javascript
// Multer middleware handles file upload
router.post('/upload-cv', uploadCV.single('cv'), uploadCv);

// Controller
const uploadCv = async (req, res) => {
  // File saved to: uploads/cv/{filename}
  return {
    fileId: fileName,
    filePath: filePath,
    originalName: req.file.originalname,
    size: req.file.size
  };
};
```

**2. Extraction Endpoint** (`POST /extract-cv-data`)
```javascript
const extractCvData = async (req, res) => {
  const { fileId } = req.body;
  const filePath = path.join(__dirname, '../uploads/cv', fileId);
  
  // Call CV extraction service
  const extractionResult = await CVExtractionService.extractCvData(filePath);
  
  return {
    data: extractionResult.data,  // Extracted fields
    validation: validation         // Warnings/errors
  };
};
```

### 1.2 CV Extraction Service Details

#### **Supported File Types**
- **PDF**: Uses `pdf-parse` library
- **DOCX**: Uses `mammoth` library
- **File Size**: Max 10MB

#### **Extraction Process**
```javascript
class CVExtractionService {
  static async extractCvData(filePath) {
    // 1. Parse file based on type
    if (fileExtension === '.pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      parsedData = await pdfParse(dataBuffer);
    } else if (fileExtension === '.docx') {
      parsedData = await mammoth.extractRawText({ path: filePath });
    }
    
    // 2. Structure the extracted text
    const structuredData = this.structureExtractedData(parsedData);
    
    return { success: true, data: structuredData };
  }
}
```

#### **AI-Powered Data Extraction** (Regex + Pattern Matching)

**1. Personal Information**
```javascript
// Email Extraction (Enhanced)
const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const emailMatches = text.match(emailRegex);
// Filters: non-company emails (no 'noreply', 'admin@', 'info@')

// Phone Number Extraction (Multi-format)
const phoneRegexes = [
  /(\+?94|0)?[0-9]{2,3}[-\s]?[0-9]{7}/g,     // Sri Lankan
  /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g,  // US
  /(\+?44[-.\s]?)?\(?([0-9]{4})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{3})/g, // UK
  /(\+?91[-.\s]?)?\(?([0-9]{5})\)?[-.\s]?([0-9]{5})/g, // Indian
  /(\+?[1-9]\d{1,14})/g  // International
];

// Name Extraction (Pattern-based)
// Looks in first 5 lines for 2-4 words with only letters
if (/^[A-Za-z\s\-\.]+$/.test(line) && nameParts.length >= 2 && nameParts.length <= 4) {
  firstName = nameParts[0];
  lastName = nameParts.slice(1).join(' ');
}
```

**2. Education Information**
```javascript
// Keywords: 'education', 'degree', 'university', 'college', 'bachelor', 'master', 'phd'
// Searches nearby lines for:
if (line.includes('Bachelor') || line.includes('Master') || line.includes('Degree')) {
  degree = line;
}
if (line.includes('University') || line.includes('College')) {
  institution = line;
}

// Graduation Year (Smart Detection)
const yearRegex = /(19|20)\d{2}/g;
// Filters: 1990-current year, looks for context keywords:
// 'graduated', 'degree', 'bachelor', 'master', 'phd'

// GPA Extraction
const gpaRegexes = [
  /GPA[:\s]*([0-9]+\.[0-9]+)/gi,
  /([0-9]+\.[0-9]+)\s*\/\s*4\.0/gi,
  /([0-9]+\.[0-9]+)\s*\/\s*4/gi
];

// IELTS Score
const ieltsRegexes = [
  /IELTS[:\s]*([0-9]+\.[0-9])/gi,
  /([0-9]+\.[0-9])\s*IELTS/gi
];
```

**3. Work Experience**
```javascript
// Keywords: 'experience', 'employment', 'work', 'job', 'company', 'projects'
// Pattern 1: "Position | Company (Date)"
if (line.includes('|') && line.includes('(') && line.includes(')')) {
  workExperience.push({
    company: extractedCompany,
    position: extractedPosition,
    startDate: extractedDate,
    endDate: '',
    description: ''
  });
}

// Pattern 2: "Position at Company - Date"
if (line.includes(' at ') || line.includes(' - ')) {
  const parts = line.split(/ at | - /);
  workExperience.push({ ... });
}
```

**4. Skills Extraction** (Most Advanced)
```javascript
// Keywords: 'technical skills', 'skills', 'technologies', 'programming'
// Common Tech Skills Database:
const commonTechSkills = [
  'JavaScript', 'Python', 'Java', 'C#', 'C++', 'PHP', 'Ruby', 'Go', 'Swift', 'Kotlin',
  'React', 'Angular', 'Vue.js', 'Node.js', 'Express', 'Django', 'Flask',
  'HTML', 'CSS', 'SASS', 'Bootstrap', 'Tailwind',
  'MySQL', 'PostgreSQL', 'MongoDB', 'Redis',
  'AWS', 'Azure', 'Docker', 'Kubernetes', 'Jenkins', 'Git'
];

// Extraction Strategy:
// 1. Find skills section
// 2. Split by separators: [,;|•\-\n\t]
// 3. Match against common skills database
// 4. Also search entire document for tech skills
// 5. Remove duplicates and capitalize
```

**5. Social Links**
```javascript
// GitHub
const githubRegex = /github\.com\/[a-zA-Z0-9\-_]+/g;
structured.github = 'https://' + match[0];

// LinkedIn
const linkedinRegex = /linkedin\.com\/in\/[a-zA-Z0-9\-_]+/g;
structured.linkedin = 'https://' + match[0];

// Portfolio
const portfolioRegex = /(portfolio|website|personal).*?https?:\/\/[^\s]+/gi;
```

#### **Validation System**
```javascript
static validateExtractedData(data) {
  const warnings = [];
  
  if (!data.firstName && !data.lastName) warnings.push('No name found');
  if (!data.email) warnings.push('No email found');
  if (!data.phone) warnings.push('No phone found');
  if (!data.institution && !data.degree) warnings.push('No education found');
  if (!data.workExperience || data.workExperience.length === 0) 
    warnings.push('No work experience found');
  if (!data.skills || data.skills.length === 0) 
    warnings.push('No skills found');
  
  return { isValid: errors.length === 0, errors, warnings };
}
```

### 1.3 Frontend Display & Auto-fill

#### **Progress Tracking**
```javascript
const [cvUploadStatus, setCvUploadStatus] = useState('idle'); 
// States: 'idle', 'uploading', 'processing', 'success', 'error'
const [cvExtractionProgress, setCvExtractionProgress] = useState(0); // 0-100

// Progress simulation:
setCvExtractionProgress(30);   // After upload
setCvExtractionProgress(60);   // During extraction
setCvExtractionProgress(100);  // Complete
```

#### **UI Components**
1. **File Upload Area** (Drag & Drop or Click)
   - Shows icon, instructions, supported formats
   - Validates file type/size before upload

2. **File Preview** (After selection)
   - Displays filename, size
   - "Extract Data" button
   - Delete button

3. **Progress Bar** (During processing)
   - Shows "Uploading CV..." or "Extracting data..."
   - Percentage indicator

4. **Success Card** (After extraction)
   - Green border, checkmark icon
   - Summary: "Personal Info", "Education", "X entries", "X skills"
   - Full details in extraction result

5. **Auto-fill Confirmation**
   ```javascript
   autoFillFormFromCv(extractedData) {
     setFormData(prev => ({
       ...prev,
       firstName: extractedData.firstName || prev.firstName,
       lastName: extractedData.lastName || prev.lastName,
       email: extractedData.email || prev.email,
       // ... all other fields
       workExperience: extractedData.workExperience || prev.workExperience,
       skills: extractedData.skills || prev.skills
     }));
   }
   ```

---

## 2. University Finder System

### 2.1 Architecture (Project-Mentora-Core)

#### **Frontend Flow** (`UniversityFinder.js`)

```javascript
// Step 1: Select student
<Autocomplete
  options={mockStudents}
  getOptionLabel={(option) => `${option.id} - ${option.name}`}
  onChange={(event, newValue) => {
    handleInputChange('studentId', newValue?.id);
  }}
/>

// Step 2: Set preferences
const preferences = {
  degreeType: 'Master',           // Bachelor, Master, PhD, Diploma
  ukZone: 'England',              // England, Scotland, Wales, N.Ireland
  facilities: ['Library', 'Sports Center'],
  priceRange: '£20,000 - £25,000',
  yearOfDegree: '2 Years',
  semesterType: 'Full-time',
  languages: ['English'],
  opportunities: ['Research', 'Internships']
};

// Step 3: Find universities (AI Search)
const handleFindUniversities = async () => {
  setIsSearching(true);
  setSearchProgress(0);
  
  // Simulate AI progress (0% → 100%)
  const searchInterval = setInterval(() => {
    setSearchProgress(prev => prev + 10);
  }, 200);
  
  // Filter universities based on preferences
  const filteredUniversities = ukUniversities.filter(uni => {
    return (
      (!degreeType || uni.degreeTypes.includes(degreeType)) &&
      (!ukZone || uni.zone === ukZone) &&
      (!priceRange || uni.priceRange === priceRange) &&
      // ... other filters
    );
  });
  
  // Calculate match scores and rank
  const rankedUniversities = filteredUniversities
    .map(uni => ({
      ...uni,
      matchScore: calculateMatchScore(uni),
      reasons: generateReasons(uni)
    }))
    .sort((a, b) => b.matchScore - a.matchScore);
  
  setSearchResults(rankedUniversities);
  setShowResults(true);
};
```

### 2.2 AI Matching Algorithm

#### **Match Score Calculation**
```javascript
const calculateMatchScore = (university) => {
  let score = 0;
  
  // 1. Base ranking score (higher ranking = higher score)
  score += (6 - university.ranking) * 10;  // Top 1 = 50 points, Top 5 = 10 points
  
  // 2. Zone preference match (+20 points)
  if (formData.ukZone && university.zone === formData.ukZone) {
    score += 20;
  }
  
  // 3. Price range match (+15 points)
  if (formData.priceRange && university.priceRange === formData.priceRange) {
    score += 15;
  }
  
  // 4. Facilities match (+5 points per match)
  const facilityMatches = formData.facilities.filter(fac => 
    university.facilities.includes(fac)
  ).length;
  score += facilityMatches * 5;
  
  // 5. Language match (+10 points per match)
  const languageMatches = formData.languages.filter(lang => 
    university.languages.includes(lang)
  ).length;
  score += languageMatches * 10;
  
  // 6. Opportunities match (+8 points per match)
  const opportunityMatches = formData.opportunities.filter(opp => 
    university.opportunities.includes(opp)
  ).length;
  score += opportunityMatches * 8;
  
  return score;
};
```

#### **Reason Generation**
```javascript
const generateReasons = (university) => {
  const reasons = [];
  
  if (university.ranking <= 3) {
    reasons.push(`Top ${university.ranking} UK university with exceptional reputation`);
  }
  
  if (formData.ukZone && university.zone === formData.ukZone) {
    reasons.push(`Located in your preferred region: ${university.zone}`);
  }
  
  if (formData.priceRange && university.priceRange === formData.priceRange) {
    reasons.push(`Fits your budget range: ${university.priceRange}`);
  }
  
  const facilityMatches = formData.facilities.filter(fac => 
    university.facilities.includes(fac)
  );
  if (facilityMatches.length > 0) {
    reasons.push(`Offers your preferred facilities: ${facilityMatches.join(', ')}`);
  }
  
  const opportunityMatches = formData.opportunities.filter(opp => 
    university.opportunities.includes(opp)
  );
  if (opportunityMatches.length > 0) {
    reasons.push(`Provides desired opportunities: ${opportunityMatches.join(', ')}`);
  }
  
  return reasons;
};
```

### 2.3 UI Components

#### **1. Student Selection Section**
```javascript
<Autocomplete
  options={students}
  renderInput={(params) => <TextField {...params} label="Select Student" />}
/>
```

#### **2. Preferences Form**
- Degree Type (dropdown)
- UK Zone (dropdown)
- Facilities (multi-select chips)
- Price Range (dropdown)
- Duration (dropdown)
- Semester Type (dropdown)
- Languages (multi-select)
- Opportunities (multi-select)

#### **3. Find Universities Button**
```javascript
<Button
  variant="contained"
  onClick={handleFindUniversities}
  disabled={!formData.studentId || isSearching}
  startIcon={isSearching ? <CircularProgress /> : <AutoAwesomeIcon />}
>
  {isSearching ? 'AI is Searching...' : 'Find Best Universities'}
</Button>
```

#### **4. Search Progress**
```javascript
{isSearching && (
  <Paper>
    <AutoAwesomeIcon sx={{ fontSize: 48, color: '#8b5cf6' }} />
    <Typography>AI is analyzing your preferences...</Typography>
    <LinearProgress variant="determinate" value={searchProgress} />
    <Typography>{searchProgress}% Complete</Typography>
  </Paper>
)}
```

#### **5. Results Cards** (Ranked Universities)
```javascript
{searchResults.map((university, index) => (
  <Card key={university.id}>
    {index === 0 && <Badge>BEST MATCH</Badge>}
    
    <Box>
      <Avatar>#{index + 1}</Avatar>
      <Typography>{university.name}</Typography>
      <Typography>{university.zone} • Ranking: {university.ranking}</Typography>
    </Box>
    
    <Typography>{university.description}</Typography>
    
    <Box>
      <Typography>Why this university is perfect for you:</Typography>
      {university.reasons.map(reason => (
        <Box>
          <CheckCircleIcon />
          <Typography>{reason}</Typography>
        </Box>
      ))}
    </Box>
    
    <Box>
      <Typography>Match Score: {university.matchScore}%</Typography>
      <Button>Details</Button>
    </Box>
  </Card>
))}
```

#### **6. Save Rankings**
```javascript
const handleSaveRankings = () => {
  const rankings = searchResults.map((uni, index) => ({
    rank: index + 1,
    universityId: uni.id,
    universityName: uni.name,
    matchScore: uni.matchScore,
    reasons: uni.reasons
  }));
  
  setFormData(prev => ({
    ...prev,
    selectedRankings: rankings
  }));
};
```

---

## 3. Application to Student Portal

### 3.1 CV Extraction for Student Portal

#### **Key Differences from Employee Dashboard**

| Feature | Employee Dashboard | Student Portal |
|---------|-------------------|----------------|
| **User** | Employee creates student profile | Student creates own profile |
| **Authentication** | Employee JWT token | Student JWT token |
| **Upload Endpoint** | `/api/students/upload-cv` | `/api/v1/students/cv/upload` |
| **Extract Endpoint** | `/api/students/extract-cv-data` | `/api/v1/students/cv/extract` |
| **File Storage** | `uploads/cv/` | `uploads/cv/` (same) |
| **Auto-fill** | Employee form | Student profile completion form |

#### **Implementation for Student Portal**

**Backend (Already Implemented in Mentora-Consulting-Student-Web-API)**

✅ **File Upload** (`middlewares/fileUpload.js`)
```javascript
const uploadCV = multer({
  storage: cvStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and DOCX files are allowed'));
    }
  }
});
```

✅ **CV Extraction Service** (`services/cvExtractionService.js`)
- **Same implementation** as Project-Mentora-API
- Uses `pdf-parse` for PDF files
- Uses `mammoth` for DOCX files
- Pattern-based extraction for all fields
- Returns structured data matching Student model

✅ **API Endpoints** (`controllers/studentController.js`)
```javascript
// Upload CV
POST /api/v1/students/cv/upload
- Auth: Required (student token)
- Body: FormData with 'cv' file
- Returns: { cvPath, message }

// Extract CV Data
POST /api/v1/students/cv/extract
- Auth: Required (student token)
- Reads cvPath from authenticated student record
- Returns: { personalInfo, education, workExperience, skills, references }
```

**Frontend Integration** (`StudentProfileCompletionPage.tsx`)

✅ **Current Implementation** (Simulated)
```typescript
const handleCvUpload = () => {
  setCvUploading(true);
  
  // Simulated extraction (timeout)
  setTimeout(() => {
    const extractedData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      // ... other fields
    };
    setProfileData(prev => ({ ...prev, ...extractedData }));
    setCvUploading(false);
  }, 2000);
};
```

🔄 **Updated Implementation** (Real API Integration)
```typescript
import axios from 'axios';

const API_BASE = 'http://localhost:5001/api/v1';

const handleCvUpload = async () => {
  if (!cvFile) return;
  
  setCvUploading(true);
  setCvProgress(0);
  
  try {
    // Get auth token from Redux/localStorage
    const token = localStorage.getItem('studentToken');
    
    // Step 1: Upload CV file
    const formData = new FormData();
    formData.append('cv', cvFile);
    
    const uploadRes = await axios.post(`${API_BASE}/students/cv/upload`, formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    });
    
    setCvProgress(50);
    
    // Step 2: Extract data from uploaded CV
    const extractRes = await axios.post(`${API_BASE}/students/cv/extract`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    setCvProgress(100);
    
    // Step 3: Auto-fill form with extracted data
    const extracted = extractRes.data.data;
    setProfileData(prev => ({
      ...prev,
      // Personal Info
      firstName: extracted.personalInfo?.firstName || prev.firstName,
      lastName: extracted.personalInfo?.lastName || prev.lastName,
      email: extracted.personalInfo?.email || prev.email,
      phone: extracted.personalInfo?.phone || prev.phone,
      dateOfBirth: extracted.personalInfo?.dateOfBirth || prev.dateOfBirth,
      
      // Education
      degree: extracted.education[0]?.degree || prev.degree,
      university: extracted.education[0]?.institution || prev.university,
      graduationYear: extracted.education[0]?.graduationYear || prev.graduationYear,
      gpa: extracted.education[0]?.gpa || prev.gpa,
      
      // Work Experience (append to existing)
      workExperience: [
        ...prev.workExperience,
        ...extracted.workExperience.map(exp => ({
          company: exp.company,
          position: exp.position,
          startDate: exp.startDate,
          endDate: exp.endDate,
          description: exp.description
        }))
      ],
      
      // Skills (merge and remove duplicates)
      skills: [...new Set([...prev.skills, ...extracted.skills])],
      
      // References
      github: extracted.references?.github || prev.github,
      linkedin: extracted.references?.linkedin || prev.linkedin,
      portfolio: extracted.references?.portfolio || prev.portfolio
    }));
    
    setShowCvSuccess(true);
    setCvUploading(false);
    
  } catch (error) {
    console.error('CV upload failed:', error);
    setCvError(error.response?.data?.message || 'Failed to process CV');
    setCvUploading(false);
  }
};
```

### 3.2 University Finder for Student Portal

#### **Current Status**
- ❌ **NOT implemented** in either backend
- 📊 Uses **mock data** in Project-Mentora-Core
- 🔮 **Future feature** for student portal

#### **Proposed Implementation**

**Backend Architecture**

**1. University Database** (PostgreSQL)
```sql
-- University Master Table (Already exists)
mentora_ref.ref_mas_university
  - university_id
  - university_name
  - base_url
  - country
  - status
  
-- New: University Details Table
CREATE TABLE mentora_ref.ref_university_details (
  university_id VARCHAR(10) PRIMARY KEY,
  zone VARCHAR(50),  -- England, Scotland, Wales, N.Ireland
  ranking INT,
  degree_types JSONB,  -- ["Bachelor", "Master", "PhD"]
  facilities JSONB,    -- ["Library", "Sports Center", ...]
  price_range VARCHAR(50),
  languages JSONB,     -- ["English", "Welsh", ...]
  opportunities JSONB, -- ["Research", "Internships", ...]
  description TEXT,
  strengths JSONB,     -- ["Academic Excellence", ...]
  image_url VARCHAR(255),
  FOREIGN KEY (university_id) REFERENCES mentora_ref.ref_mas_university(university_id)
);

-- Student University Preferences
CREATE TABLE mentora_ref.ref_student_uni_preferences (
  student_id VARCHAR(10) PRIMARY KEY,
  degree_type VARCHAR(50),
  uk_zone VARCHAR(50),
  facilities JSONB,
  price_range VARCHAR(50),
  year_of_degree VARCHAR(20),
  semester_type VARCHAR(20),
  languages JSONB,
  opportunities JSONB,
  FOREIGN KEY (student_id) REFERENCES mentora_ref.ref_mas_student(student_id)
);

-- University Recommendations (saved rankings)
CREATE TABLE mentora_ref.ref_student_uni_recommendations (
  recommendation_id SERIAL PRIMARY KEY,
  student_id VARCHAR(10),
  university_id VARCHAR(10),
  rank INT,
  match_score INT,
  reasons JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES mentora_ref.ref_mas_student(student_id),
  FOREIGN KEY (university_id) REFERENCES mentora_ref.ref_mas_university(university_id)
);
```

**2. API Endpoints** (Mentora-Consulting-Student-Web-API)

```javascript
// routes/universityRoutes.js
const express = require('express');
const router = express.Router();
const { authenticateStudent } = require('../middlewares/auth');
const universityController = require('../controllers/universityController');

// Get all universities (with details)
router.get('/universities', universityController.getAllUniversities);

// Get university details
router.get('/universities/:universityId', universityController.getUniversityDetails);

// Search universities by preferences (AI matching)
router.post('/universities/search', authenticateStudent, universityController.searchUniversities);

// Save student preferences
router.post('/preferences', authenticateStudent, universityController.savePreferences);

// Get student preferences
router.get('/preferences', authenticateStudent, universityController.getPreferences);

// Save university recommendations
router.post('/recommendations', authenticateStudent, universityController.saveRecommendations);

// Get student recommendations
router.get('/recommendations', authenticateStudent, universityController.getRecommendations);

module.exports = router;
```

**3. University Controller**

```javascript
// controllers/universityController.js
const { sequelize } = require('../models');

// Search universities with AI matching
const searchUniversities = async (req, res) => {
  try {
    const studentId = req.student.studentId;
    const {
      degreeType,
      ukZone,
      facilities,
      priceRange,
      yearOfDegree,
      semesterType,
      languages,
      opportunities
    } = req.body;
    
    // 1. Get all universities matching basic criteria
    const query = `
      SELECT 
        u.university_id,
        u.university_name,
        ud.zone,
        ud.ranking,
        ud.degree_types,
        ud.facilities,
        ud.price_range,
        ud.languages,
        ud.opportunities,
        ud.description,
        ud.strengths,
        ud.image_url
      FROM mentora_ref.ref_mas_university u
      JOIN mentora_ref.ref_university_details ud ON u.university_id = ud.university_id
      WHERE u.status = 'active'
        AND ($1::varchar IS NULL OR ud.zone = $1)
        AND ($2::varchar IS NULL OR ud.price_range = $2)
        AND ($3::jsonb IS NULL OR ud.degree_types @> $3)
    `;
    
    const universities = await sequelize.query(query, {
      bind: [
        ukZone || null,
        priceRange || null,
        degreeType ? JSON.stringify([degreeType]) : null
      ],
      type: sequelize.QueryTypes.SELECT
    });
    
    // 2. Calculate match scores
    const scoredUniversities = universities.map(uni => {
      let score = 0;
      const reasons = [];
      
      // Base ranking score
      score += (100 - uni.ranking) * 2;
      if (uni.ranking <= 10) {
        reasons.push(`Top ${uni.ranking} UK university with exceptional reputation`);
      }
      
      // Zone match
      if (ukZone && uni.zone === ukZone) {
        score += 20;
        reasons.push(`Located in your preferred region: ${uni.zone}`);
      }
      
      // Price range match
      if (priceRange && uni.price_range === priceRange) {
        score += 15;
        reasons.push(`Fits your budget range: ${uni.price_range}`);
      }
      
      // Facilities match
      if (facilities && Array.isArray(facilities)) {
        const unisFacilities = uni.facilities || [];
        const matches = facilities.filter(f => unisFacilities.includes(f));
        score += matches.length * 5;
        if (matches.length > 0) {
          reasons.push(`Offers your preferred facilities: ${matches.join(', ')}`);
        }
      }
      
      // Languages match
      if (languages && Array.isArray(languages)) {
        const unisLanguages = uni.languages || [];
        const matches = languages.filter(l => unisLanguages.includes(l));
        score += matches.length * 10;
        if (matches.length > 0) {
          reasons.push(`Teaching in your preferred languages: ${matches.join(', ')}`);
        }
      }
      
      // Opportunities match
      if (opportunities && Array.isArray(opportunities)) {
        const unisOpportunities = uni.opportunities || [];
        const matches = opportunities.filter(o => unisOpportunities.includes(o));
        score += matches.length * 8;
        if (matches.length > 0) {
          reasons.push(`Provides your desired opportunities: ${matches.join(', ')}`);
        }
      }
      
      return {
        ...uni,
        matchScore: Math.min(score, 100), // Cap at 100%
        reasons
      };
    });
    
    // 3. Sort by match score
    const rankedUniversities = scoredUniversities
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10); // Top 10 matches
    
    res.json({
      success: true,
      message: 'Universities found successfully',
      data: rankedUniversities
    });
    
  } catch (error) {
    console.error('University search error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search universities',
      error: error.message
    });
  }
};

// Save recommendations
const saveRecommendations = async (req, res) => {
  try {
    const studentId = req.student.studentId;
    const { rankings } = req.body;
    
    // Delete existing recommendations
    await sequelize.query(
      'DELETE FROM mentora_ref.ref_student_uni_recommendations WHERE student_id = $1',
      { bind: [studentId] }
    );
    
    // Insert new recommendations
    for (const ranking of rankings) {
      await sequelize.query(
        `INSERT INTO mentora_ref.ref_student_uni_recommendations 
         (student_id, university_id, rank, match_score, reasons)
         VALUES ($1, $2, $3, $4, $5)`,
        {
          bind: [
            studentId,
            ranking.universityId,
            ranking.rank,
            ranking.matchScore,
            JSON.stringify(ranking.reasons)
          ]
        }
      );
    }
    
    res.json({
      success: true,
      message: 'Recommendations saved successfully'
    });
    
  } catch (error) {
    console.error('Save recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save recommendations',
      error: error.message
    });
  }
};

module.exports = {
  getAllUniversities,
  getUniversityDetails,
  searchUniversities,
  savePreferences,
  getPreferences,
  saveRecommendations,
  getRecommendations
};
```

**Frontend Implementation** (New Component: `UniversityFinder.tsx`)

```typescript
// src/pages/Dashboard/UniversityFinder.tsx
import React, { useState } from 'react';
import axios from 'axios';

interface UniversityPreferences {
  degreeType: string;
  ukZone: string;
  facilities: string[];
  priceRange: string;
  yearOfDegree: string;
  semesterType: string;
  languages: string[];
  opportunities: string[];
}

interface University {
  universityId: string;
  universityName: string;
  zone: string;
  ranking: number;
  matchScore: number;
  reasons: string[];
  description: string;
  imageUrl: string;
}

const UniversityFinder: React.FC = () => {
  const [preferences, setPreferences] = useState<UniversityPreferences>({
    degreeType: '',
    ukZone: '',
    facilities: [],
    priceRange: '',
    yearOfDegree: '',
    semesterType: '',
    languages: [],
    opportunities: []
  });
  
  const [universities, setUniversities] = useState<University[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState(0);
  
  const handleSearch = async () => {
    setIsSearching(true);
    setSearchProgress(0);
    
    // Simulate progress
    const interval = setInterval(() => {
      setSearchProgress(prev => Math.min(prev + 10, 90));
    }, 200);
    
    try {
      const token = localStorage.getItem('studentToken');
      const response = await axios.post(
        'http://localhost:5001/api/v1/universities/search',
        preferences,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      clearInterval(interval);
      setSearchProgress(100);
      setUniversities(response.data.data);
      setIsSearching(false);
      
    } catch (error) {
      clearInterval(interval);
      console.error('Search failed:', error);
      setIsSearching(false);
    }
  };
  
  const handleSaveRankings = async () => {
    try {
      const token = localStorage.getItem('studentToken');
      const rankings = universities.map((uni, index) => ({
        rank: index + 1,
        universityId: uni.universityId,
        universityName: uni.universityName,
        matchScore: uni.matchScore,
        reasons: uni.reasons
      }));
      
      await axios.post(
        'http://localhost:5001/api/v1/recommendations',
        { rankings },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      alert('Rankings saved successfully!');
      
    } catch (error) {
      console.error('Save failed:', error);
    }
  };
  
  return (
    <div className="university-finder">
      {/* Preferences Form */}
      <div className="preferences-section">
        <h2>University Preferences</h2>
        {/* ... form fields for preferences */}
        <button onClick={handleSearch} disabled={isSearching}>
          {isSearching ? 'AI is Searching...' : 'Find Best Universities'}
        </button>
      </div>
      
      {/* Search Progress */}
      {isSearching && (
        <div className="search-progress">
          <div className="progress-bar" style={{ width: `${searchProgress}%` }} />
          <p>{searchProgress}% Complete</p>
        </div>
      )}
      
      {/* Results */}
      {universities.length > 0 && (
        <div className="results-section">
          <h2>Top Matches</h2>
          <button onClick={handleSaveRankings}>Save Rankings</button>
          
          {universities.map((uni, index) => (
            <div key={uni.universityId} className="university-card">
              {index === 0 && <div className="best-match-badge">BEST MATCH</div>}
              
              <div className="university-header">
                <div className="rank-badge">#{index + 1}</div>
                <div>
                  <h3>{uni.universityName}</h3>
                  <p>{uni.zone} • Ranking: {uni.ranking}</p>
                </div>
              </div>
              
              <p>{uni.description}</p>
              
              <div className="reasons">
                <h4>Why this university is perfect for you:</h4>
                {uni.reasons.map((reason, idx) => (
                  <div key={idx} className="reason-item">
                    <span>✓</span>
                    <p>{reason}</p>
                  </div>
                ))}
              </div>
              
              <div className="match-score">
                Match Score: {uni.matchScore}%
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UniversityFinder;
```

---

## 4. Summary & Next Steps

### 4.1 CV Extraction - Ready for Integration ✅

**Backend Status**: ✅ Complete
- File upload middleware configured
- CV extraction service implemented
- API endpoints created
- Database fields ready (cvPath in Student model)

**Frontend Status**: 🔄 Needs Integration
- UI already exists in StudentProfileCompletionPage
- Currently uses simulated data
- Need to replace with real API calls

**Action Items**:
1. ✅ Replace simulated CV upload with real API call
2. ✅ Add authentication token to requests
3. ✅ Handle errors gracefully
4. ✅ Test with real PDF and DOCX files

### 4.2 University Finder - Requires Full Implementation ❌

**Backend Status**: ❌ Not Implemented
- No university details table
- No preferences table
- No recommendations table
- No search endpoint
- No AI matching algorithm

**Frontend Status**: ❌ Not Implemented
- No university finder component
- No preferences form
- No results display

**Action Items**:
1. ❌ Create database schema (3 new tables)
2. ❌ Populate university details data (50+ UK universities)
3. ❌ Create API endpoints (6 endpoints)
4. ❌ Implement AI matching algorithm
5. ❌ Build frontend component
6. ❌ Add to student dashboard navigation

### 4.3 Priority Recommendations

**High Priority (Immediate)**:
1. **Integrate CV Extraction** - Backend ready, just needs frontend integration
2. **Test CV Auto-fill** - Ensure all fields populate correctly

**Medium Priority (Next Sprint)**:
1. **Plan University Finder** - Define requirements with stakeholders
2. **Design Database Schema** - Create ERD for university data
3. **Collect University Data** - Research UK universities

**Low Priority (Future)**:
1. **Implement University Finder Backend**
2. **Build University Finder Frontend**
3. **Add Advanced Filters** (ranking ranges, specific courses, etc.)

---

## 5. Technical Insights

### 5.1 Why CV Extraction Works Well

**Strengths**:
✅ Pattern-based extraction is fast and reliable
✅ No external API costs (uses pdf-parse + mammoth)
✅ Works offline
✅ Handles multiple formats (PDF, DOCX)
✅ Smart phone number detection (international formats)
✅ Skills database matching improves accuracy
✅ Validation system provides feedback

**Limitations**:
⚠️ Not truly AI-powered (regex + patterns, not ML)
⚠️ Accuracy depends on CV format/structure
⚠️ May miss data in unusual formats
⚠️ No OCR for scanned PDFs
⚠️ Limited to English language CVs

**Improvements Possible**:
🔮 Add OCR support (Tesseract.js)
🔮 Use GPT-4 API for better extraction
🔮 Train custom NER model
🔮 Support more languages
🔮 Add confidence scores

### 5.2 University Finder AI Matching

**Current Approach** (Score-based):
- Simple weighted scoring system
- Deterministic (same inputs → same results)
- Easy to debug and explain
- Fast execution
- No ML required

**Alternative Approaches**:
1. **Collaborative Filtering** (like Netflix recommendations)
   - Learn from other students' choices
   - "Students like you also applied to..."
   
2. **Content-Based Filtering**
   - Match student profile to university characteristics
   - Use embeddings (vector similarity)
   
3. **Hybrid Approach**
   - Combine scoring + ML predictions
   - Use historical data to improve weights

**Data Sources for UK Universities**:
- QS World Rankings API
- Times Higher Education API
- UCAS (Universities and Colleges Admissions Service)
- Gov.uk university data
- University websites (web scraping)

---

## End of Analysis

This document provides a complete overview of how CV extraction and university finder systems work in the Project-Mentora ecosystem and how they can be applied to the student portal.

**Key Takeaways**:
1. ✅ CV extraction is **ready to integrate** - just needs frontend API calls
2. ❌ University finder requires **full implementation** - backend + frontend + data
3. 🔧 Both features follow **clear architectural patterns**
4. 📊 AI matching uses **simple scoring algorithms** (not deep learning)
5. 🚀 Can be **enhanced with ML** in the future
