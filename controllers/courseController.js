const UniversityCourse = require('../models/UniversityCourse');

/**
 * Check if student meets entry requirements for a course
 * Returns { eligible: boolean, failedRequirements: [], warnings: [] }
 */
const checkEntryRequirements = (course, studentProfile) => {
  const result = {
    eligible: true,
    failedRequirements: [],
    warnings: [],
    details: {}
  };

  // 1. Check IELTS Requirements (HARD REQUIREMENT)
  if (course.ieltsOverall && studentProfile.ieltsScore) {
    const studentIELTS = parseFloat(studentProfile.ieltsScore);
    const requiredIELTS = parseFloat(course.ieltsOverall);
    
    result.details.ieltsCheck = {
      studentScore: studentIELTS,
      required: requiredIELTS,
      met: studentIELTS >= requiredIELTS
    };
    
    if (studentIELTS < requiredIELTS) {
      const deficit = (requiredIELTS - studentIELTS).toFixed(1);
      result.eligible = false;
      result.failedRequirements.push(`IELTS: Need ${requiredIELTS}, have ${studentIELTS} (${deficit} points short)`);
    } else if (studentIELTS < requiredIELTS + 0.5) {
      result.warnings.push(`IELTS score ${studentIELTS} just meets requirement of ${requiredIELTS}`);
    }
  }

  // 2. Check GPA Requirements (if student has GPA data)
  if (course.minimumGpa && studentProfile.gpa) {
    const courseGPA = course.minimumGpa.toLowerCase();
    const studentGPA = parseFloat(studentProfile.gpa);
    
    // Skip GPA check if course uses UCAS points or non-numeric requirements
    if (courseGPA.includes('ucas') || courseGPA.includes('points') || 
        courseGPA.includes('varies') || courseGPA.includes('hnd') || 
        courseGPA.includes('fda') || courseGPA.includes('master degree')) {
      // Skip - these are UK-specific admission requirements, not GPA
      result.details.gpaCheck = {
        studentGPA: studentGPA,
        required: 0,
        met: true,
        note: 'Course uses alternative admission criteria'
      };
    } else {
      // Parse different GPA formats from course data (e.g., "2.2/4.0", "3.0", "2:2")
      let requiredGPA = 0;
      if (courseGPA.includes('2.2/4') || courseGPA.includes('2:2')) {
        requiredGPA = 2.2;
      } else if (courseGPA.includes('2.1/4') || courseGPA.includes('2:1')) {
        requiredGPA = 2.5;
      } else if (courseGPA.includes('1st') || courseGPA.includes('first')) {
        requiredGPA = 3.5;
      } else {
        const gpaMatch = courseGPA.match(/(\d+\.?\d*)/);
        if (gpaMatch) {
          requiredGPA = parseFloat(gpaMatch[1]);
          // If extracted number is > 10, it's likely not a GPA
          if (requiredGPA > 10) {
            requiredGPA = 0; // Skip this requirement
          }
        }
      }
      
      if (requiredGPA > 0) {
        result.details.gpaCheck = {
          studentGPA: studentGPA,
          required: requiredGPA,
          met: studentGPA >= requiredGPA
        };
        
        if (studentGPA < requiredGPA) {
          result.eligible = false;
          result.failedRequirements.push(`GPA: Need ${requiredGPA}/4.0, have ${studentGPA}/4.0`);
        }
      }
    }
  }

  // 3. Check Academic Requirements (Bachelor's degree for Masters, etc.)
  if (course.academicRequirements && studentProfile.education) {
    const requirements = course.academicRequirements.toLowerCase();
    const hasEducation = Array.isArray(studentProfile.education) && studentProfile.education.length > 0;
    
    // Check for Bachelor's degree requirement
    if (requirements.includes("bachelor") && hasEducation) {
      const hasBachelors = studentProfile.education.some(edu => 
        edu && edu.degree && typeof edu.degree === 'string' && (
          edu.degree.toLowerCase().includes('bachelor') ||
          edu.degree.toLowerCase().includes('bsc') ||
          edu.degree.toLowerCase().includes('ba') ||
          edu.degree.toLowerCase().includes('beng')
        )
      );
      
      if (!hasBachelors && course.degreeLevel && course.degreeLevel.toLowerCase().includes('master')) {
        result.warnings.push("Bachelor's degree may be required for Master's programs");
      }
    }
    
    // Check for specific GPA from requirements text
    if (requirements.includes('2:2') || requirements.includes('2.2')) {
      result.details.degreeClassRequired = '2:2 or above';
    } else if (requirements.includes('2:1') || requirements.includes('2.1')) {
      result.details.degreeClassRequired = '2:1 or above';
    }
  }

  // 4. Check Work Experience Requirements
  if (course.workExperience && course.workExperience.toLowerCase() !== 'not required') {
    const hasWorkExperience = studentProfile.workExperience && 
                              Array.isArray(studentProfile.workExperience) && 
                              studentProfile.workExperience.length > 0;
    
    result.details.workExperienceRequired = course.workExperience;
    
    if (!hasWorkExperience) {
      // Don't mark as ineligible, but warn about it
      result.warnings.push(`Work experience may be required: ${course.workExperience}`);
    }
  }

  // 5. Check Prerequisites/Subject Requirements
  if (course.prerequisites && studentProfile.education) {
    const prereqs = course.prerequisites.toLowerCase();
    result.details.prerequisites = course.prerequisites;
    
    // Check if student's field of study matches prerequisites
    if (studentProfile.education && Array.isArray(studentProfile.education)) {
      const studentFields = studentProfile.education
        .filter(edu => edu && edu.fieldOfStudy && typeof edu.fieldOfStudy === 'string')
        .map(edu => edu.fieldOfStudy.toLowerCase());
      
      // Common prerequisite checks
      if (prereqs.includes('computing') || prereqs.includes('computer science')) {
        const hasRelevantBackground = studentFields.some(field => 
          field.includes('computer') || 
          field.includes('computing') || 
          field.includes('software') ||
          field.includes('it') ||
          field.includes('information technology')
        );
        
        if (!hasRelevantBackground) {
          result.warnings.push('Relevant computing/CS background may be required');
        }
      }
      
      if (prereqs.includes('mathematics') || prereqs.includes('quantitative')) {
        result.warnings.push('Mathematics or quantitative background may be required');
      }
    }
  }

  // 6. Check Budget (SOFT - allow 20% over for scholarship possibilities)
  if (course.tuitionFeeInternational && studentProfile.budget) {
    const fee = parseFloat(course.tuitionFeeInternational);
    const budget = parseFloat(studentProfile.budget);
    const overBudget = fee - budget;
    const overBudgetPercent = (overBudget / budget) * 100;
    
    result.details.budgetCheck = {
      courseFee: fee,
      studentBudget: budget,
      affordable: fee <= budget,
      overBudget: overBudget > 0 ? overBudget : 0
    };
    
    if (fee > budget * 1.2) {
      // More than 20% over budget - mark as warning
      result.warnings.push(`Fee £${fee} exceeds budget by £${Math.round(overBudget)} (${Math.round(overBudgetPercent)}%)`);
    } else if (fee > budget) {
      result.warnings.push(`Fee £${fee} slightly over budget (consider scholarships)`);
    }
  }

  return result;
};

/**
 * Calculate match score for a course based on student qualifications
 * Returns a score between 0-100
 */
const calculateMatchScore = (course, studentProfile) => {
  let score = 0;
  let maxScore = 0;
  const details = {
    ieltsMatch: 0,
    budgetMatch: 0,
    fieldMatch: 0,
    degreeLevelMatch: 0,
    studyModeMatch: 0,
    locationMatch: 0,
    totalScore: 0,
    reasons: []
  };

  // 1. IELTS Score Match (Weight: 25 points)
  maxScore += 25;
  if (studentProfile.ieltsScore && course.ieltsOverall) {
    const studentIELTS = parseFloat(studentProfile.ieltsScore);
    const requiredIELTS = parseFloat(course.ieltsOverall);
    
    if (studentIELTS >= requiredIELTS) {
      const excess = studentIELTS - requiredIELTS;
      if (excess >= 1.0) {
        score += 25; // Well above requirement
        details.ieltsMatch = 25;
        details.reasons.push(`IELTS ${studentIELTS} exceeds requirement of ${requiredIELTS}`);
      } else if (excess >= 0.5) {
        score += 20; // Above requirement
        details.ieltsMatch = 20;
        details.reasons.push(`IELTS ${studentIELTS} meets requirement of ${requiredIELTS}`);
      } else {
        score += 15; // Just meets requirement
        details.ieltsMatch = 15;
        details.reasons.push(`IELTS ${studentIELTS} meets minimum of ${requiredIELTS}`);
      }
    } else {
      const deficit = requiredIELTS - studentIELTS;
      if (deficit <= 0.5) {
        score += 8; // Close to requirement
        details.ieltsMatch = 8;
        details.reasons.push(`IELTS ${studentIELTS} slightly below ${requiredIELTS} (may still apply)`);
      } else {
        details.reasons.push(`IELTS ${studentIELTS} below requirement of ${requiredIELTS}`);
      }
    }
  }

  // 2. Budget Match (Weight: 20 points)
  maxScore += 20;
  if (studentProfile.budget && course.tuitionFeeInternational) {
    const budget = parseFloat(studentProfile.budget);
    const fee = parseFloat(course.tuitionFeeInternational);
    
    if (fee <= budget) {
      const savings = budget - fee;
      const savingsPercent = (savings / budget) * 100;
      
      if (savingsPercent >= 20) {
        score += 20; // Well within budget
        details.budgetMatch = 20;
        details.reasons.push(`Fee £${fee} well within budget of £${budget}`);
      } else if (savingsPercent >= 10) {
        score += 16; // Within budget
        details.budgetMatch = 16;
        details.reasons.push(`Fee £${fee} within budget of £${budget}`);
      } else {
        score += 12; // Just within budget
        details.budgetMatch = 12;
        details.reasons.push(`Fee £${fee} fits budget of £${budget}`);
      }
    } else {
      const excess = fee - budget;
      const excessPercent = (excess / budget) * 100;
      
      if (excessPercent <= 10) {
        score += 6; // Slightly over budget
        details.budgetMatch = 6;
        details.reasons.push(`Fee £${fee} slightly above budget (may consider with scholarship)`);
      } else {
        details.reasons.push(`Fee £${fee} exceeds budget of £${budget}`);
      }
    }
  }

  // 3. Field of Interest Match (Weight: 25 points)
  maxScore += 25;
  if (studentProfile.fieldOfInterest && course.courseName) {
    const interests = Array.isArray(studentProfile.fieldOfInterest) 
      ? studentProfile.fieldOfInterest 
      : [studentProfile.fieldOfInterest];
    
    const courseName = course.courseName.toLowerCase();
    const courseDesc = (course.courseDescription || '').toLowerCase();
    
    let matchCount = 0;
    let matchedFields = [];
    
    interests.forEach(interest => {
      const interestLower = interest.toLowerCase();
      if (courseName.includes(interestLower) || courseDesc.includes(interestLower)) {
        matchCount++;
        matchedFields.push(interest);
      }
    });
    
    if (matchCount > 0) {
      const matchScore = Math.min(25, matchCount * 15);
      score += matchScore;
      details.fieldMatch = matchScore;
      details.reasons.push(`Matches interest in ${matchedFields.join(', ')}`);
    }
  }

  // 4. Degree Level Match (Weight: 10 points)
  maxScore += 10;
  if (studentProfile.preferredDegreeLevel && course.degreeLevel) {
    if (studentProfile.preferredDegreeLevel.toLowerCase() === course.degreeLevel.toLowerCase()) {
      score += 10;
      details.degreeLevelMatch = 10;
      details.reasons.push(`Matches preferred degree level: ${course.degreeLevel}`);
    }
  }

  // 5. Study Mode Match (Weight: 10 points)
  maxScore += 10;
  if (studentProfile.preferredStudyMode && course.studyMode) {
    if (studentProfile.preferredStudyMode.toLowerCase() === course.studyMode.toLowerCase()) {
      score += 10;
      details.studyModeMatch = 10;
      details.reasons.push(`Matches preferred study mode: ${course.studyMode}`);
    } else if (course.studyMode.toLowerCase().includes(studentProfile.preferredStudyMode.toLowerCase())) {
      score += 5;
      details.studyModeMatch = 5;
    }
  }

  // 6. Location Preference Match (Weight: 20 points)
  maxScore += 20;
  if (studentProfile.preferredLocations && course.city) {
    const preferredLocs = Array.isArray(studentProfile.preferredLocations) 
      ? studentProfile.preferredLocations 
      : [studentProfile.preferredLocations];
    
    const courseCity = course.city.toLowerCase();
    const courseRegion = (course.region || '').toLowerCase();
    
    let locationMatchScore = 0;
    let matchedLocation = null;
    
    preferredLocs.forEach(location => {
      const locLower = location.toLowerCase();
      // Check for city match (highest priority)
      if (courseCity.includes(locLower) || locLower.includes(courseCity)) {
        locationMatchScore = Math.max(locationMatchScore, 20);
        matchedLocation = course.city;
      }
      // Check for region match (medium priority)
      else if (courseRegion.includes(locLower) || locLower.includes(courseRegion)) {
        locationMatchScore = Math.max(locationMatchScore, 12);
        matchedLocation = course.region;
      }
    });
    
    if (locationMatchScore > 0) {
      score += locationMatchScore;
      details.locationMatch = locationMatchScore;
      details.reasons.push(`Located in preferred area: ${matchedLocation}`);
    }
  }

  // Calculate final percentage score
  const finalScore = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  details.totalScore = finalScore;

  return {
    score: finalScore,
    details
  };
};

/**
 * Get ranked courses based on student profile
 */
exports.getRankedCourses = async (req, res) => {
  try {
    const {
      ieltsScore,
      budget,
      fieldOfInterest, // Can be array or string
      preferredDegreeLevel, // Bachelors, Masters, Doctoral
      preferredStudyMode, // Full-time, Part-time
      preferredUniversities, // Array of university names
      preferredLocations, // Array of city/region names
      minScore = 30, // Minimum match score to include
      // NEW: Student profile for entry requirements check
      gpa, // Student's GPA
      education, // Array of education history
      workExperience, // Array of work experience
      filterByRequirements = false // Whether to filter out courses student doesn't qualify for (default: false)
    } = req.body;

    // Validate required fields
    if (!ieltsScore && !budget && !fieldOfInterest && !preferredLocations) {
      return res.status(400).json({
        success: false,
        error: 'Please provide at least one criterion (IELTS score, budget, field of interest, or location preference)'
      });
    }

    // Build base query
    const query = { status: 'Active' };

    // Don't use degree level and study mode as hard filters
    // They will be used for scoring instead to give more flexible results

    // Filter by preferred universities if specified
    if (preferredUniversities && preferredUniversities.length > 0) {
      query.universityName = { $in: preferredUniversities.map(u => new RegExp(u, 'i')) };
    }

    // IELTS hard filter - only show courses student can potentially apply to
    if (ieltsScore) {
      const ielts = parseFloat(ieltsScore);
      // Include courses where requirement is <= student IELTS + 0.5 (room for improvement)
      query.ieltsOverall = { $lte: ielts + 0.5 };
    }

    // Budget hard filter - include courses up to 20% over budget (scholarship potential)
    if (budget) {
      const maxBudget = parseFloat(budget) * 1.20;
      query.tuitionFeeInternational = { $lte: maxBudget };
    }

    // Execute query
    const courses = await UniversityCourse.find(query).limit(500); // Limit for performance

    if (courses.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No courses found matching your criteria. Try adjusting your filters.',
        courses: [],
        count: 0
      });
    }

    // Build comprehensive student profile
    const studentProfile = {
      ieltsScore,
      budget,
      fieldOfInterest,
      preferredDegreeLevel,
      preferredStudyMode,
      preferredLocations,
      gpa,
      education,
      workExperience
    };

    // Check entry requirements and calculate match scores
    const rankedCourses = courses.map(course => {
      const courseObj = course.toObject();
      
      // Check if student meets entry requirements
      const requirementsCheck = checkEntryRequirements(courseObj, studentProfile);
      
      // Calculate match score
      const matchResult = calculateMatchScore(courseObj, studentProfile);
      
      return {
        ...courseObj,
        matchScore: matchResult.score,
        matchDetails: matchResult.details,
        entryRequirements: {
          eligible: requirementsCheck.eligible,
          failedRequirements: requirementsCheck.failedRequirements,
          warnings: requirementsCheck.warnings,
          details: requirementsCheck.details
        }
      };
    });

    // Filter courses based on entry requirements if enabled
    let filteredCourses = rankedCourses;
    if (filterByRequirements) {
      // Only show courses student is eligible for OR courses with only warnings (soft requirements)
      filteredCourses = rankedCourses.filter(course => 
        course.entryRequirements.eligible || 
        (course.entryRequirements.failedRequirements.length === 0 && 
         course.entryRequirements.warnings.length > 0)
      );
    }

    // Filter by minimum score and sort by match score
    const scoredCourses = filteredCourses
      .filter(course => course.matchScore >= minScore)
      .sort((a, b) => b.matchScore - a.matchScore);

    // Add ranking
    const finalCourses = scoredCourses.map((course, index) => ({
      ...course,
      rank: index + 1
    }));

    res.status(200).json({
      success: true,
      message: `Found ${finalCourses.length} matching courses`,
      courses: finalCourses,
      count: finalCourses.length,
      searchCriteria: {
        ieltsScore,
        budget,
        fieldOfInterest,
        preferredDegreeLevel,
        preferredStudyMode,
        minScore
      }
    });

  } catch (error) {
    console.error('Error in getRankedCourses:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve ranked courses',
      details: error.message
    });
  }
};

/**
 * Get course by ID
 */
exports.getCourseById = async (req, res) => {
  try {
    const { courseId } = req.params;
    
    const course = await UniversityCourse.findOne({ courseId });
    
    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    res.status(200).json({
      success: true,
      course
    });

  } catch (error) {
    console.error('Error in getCourseById:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve course',
      details: error.message
    });
  }
};

/**
 * Get all universities (unique list)
 */
exports.getUniversities = async (req, res) => {
  try {
    const universities = await UniversityCourse.distinct('universityName');
    
    res.status(200).json({
      success: true,
      universities: universities.sort(),
      count: universities.length
    });

  } catch (error) {
    console.error('Error in getUniversities:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve universities',
      details: error.message
    });
  }
};

/**
 * Get degree levels (unique list)
 */
exports.getDegreeLevels = async (req, res) => {
  try {
    const levels = await UniversityCourse.distinct('degreeLevel');
    
    res.status(200).json({
      success: true,
      degreeLevels: levels.filter(l => l).sort(),
      count: levels.length
    });

  } catch (error) {
    console.error('Error in getDegreeLevels:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve degree levels',
      details: error.message
    });
  }
};

/**
 * Get course statistics
 */
exports.getCourseStats = async (req, res) => {
  try {
    const stats = {
      totalCourses: await UniversityCourse.countDocuments(),
      byDegreeLevel: await UniversityCourse.aggregate([
        { $group: { _id: '$degreeLevel', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      byUniversity: await UniversityCourse.aggregate([
        { $group: { _id: '$universityName', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      byCity: await UniversityCourse.aggregate([
        { $group: { _id: '$city', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      byRegion: await UniversityCourse.aggregate([
        { $group: { _id: '$region', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      feeRange: await UniversityCourse.aggregate([
        { 
          $group: { 
            _id: null, 
            minFee: { $min: '$tuitionFeeInternational' },
            maxFee: { $max: '$tuitionFeeInternational' },
            avgFee: { $avg: '$tuitionFeeInternational' }
          }
        }
      ]),
      ieltsRange: await UniversityCourse.aggregate([
        { 
          $group: { 
            _id: null, 
            minIELTS: { $min: '$ieltsOverall' },
            maxIELTS: { $max: '$ieltsOverall' },
            avgIELTS: { $avg: '$ieltsOverall' }
          }
        }
      ])
    };

    res.status(200).json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Error in getCourseStats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve statistics',
      details: error.message
    });
  }
};

/**
 * Get all cities (unique list)
 */
exports.getCities = async (req, res) => {
  try {
    const cities = await UniversityCourse.distinct('city');
    
    // Get course count per city
    const citiesWithCounts = await UniversityCourse.aggregate([
      { $group: { _id: '$city', count: { $sum: 1 }, region: { $first: '$region' } } },
      { $sort: { count: -1 } }
    ]);
    
    res.status(200).json({
      success: true,
      cities: citiesWithCounts.map(c => ({
        city: c._id,
        region: c.region,
        courseCount: c.count
      })),
      count: cities.length
    });

  } catch (error) {
    console.error('Error in getCities:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve cities',
      details: error.message
    });
  }
};

/**
 * Get all regions (unique list)
 */
exports.getRegions = async (req, res) => {
  try {
    const regions = await UniversityCourse.distinct('region');
    
    // Get course count per region
    const regionsWithCounts = await UniversityCourse.aggregate([
      { $group: { _id: '$region', count: { $sum: 1 }, cities: { $addToSet: '$city' } } },
      { $sort: { count: -1 } }
    ]);
    
    res.status(200).json({
      success: true,
      regions: regionsWithCounts.map(r => ({
        region: r._id,
        cities: r.cities,
        courseCount: r.count
      })),
      count: regions.length
    });

  } catch (error) {
    console.error('Error in getRegions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve regions',
      details: error.message
    });
  }
};
