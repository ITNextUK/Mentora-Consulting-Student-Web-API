/**
 * University Location Mapping
 * Maps university names to their city and region
 */

const UNIVERSITY_LOCATIONS = {
  'BPP University': {
    city: 'London',
    region: 'Greater London',
    country: 'United Kingdom'
  },
  'Northumbria University': {
    city: 'Newcastle upon Tyne',
    region: 'North East England',
    country: 'United Kingdom'
  },
  'Southampton Solent University': {
    city: 'Southampton',
    region: 'South East England',
    country: 'United Kingdom'
  },
  'Ulster University': {
    city: 'Belfast',
    region: 'Northern Ireland',
    country: 'United Kingdom'
  },
  'University of Bedfordshire': {
    city: 'Luton',
    region: 'East of England',
    country: 'United Kingdom'
  },
  'University of Greenwich': {
    city: 'London',
    region: 'Greater London',
    country: 'United Kingdom'
  },
  'University of Roehampton': {
    city: 'London',
    region: 'Greater London',
    country: 'United Kingdom'
  },
  'University of South Wales': {
    city: 'Cardiff',
    region: 'Wales',
    country: 'United Kingdom'
  },
  'University of Suffolk': {
    city: 'Ipswich',
    region: 'East of England',
    country: 'United Kingdom'
  },
  'University of Worcester': {
    city: 'Worcester',
    region: 'West Midlands',
    country: 'United Kingdom'
  }
};

/**
 * Get location for a university
 * @param {string} universityName - Name of the university
 * @returns {object} Location object with city, region, country
 */
function getUniversityLocation(universityName) {
  return UNIVERSITY_LOCATIONS[universityName] || {
    city: 'Unknown',
    region: 'Unknown',
    country: 'United Kingdom'
  };
}

/**
 * Get all unique cities
 * @returns {Array<string>} List of all cities
 */
function getAllCities() {
  const cities = Object.values(UNIVERSITY_LOCATIONS).map(loc => loc.city);
  return [...new Set(cities)].sort();
}

/**
 * Get all unique regions
 * @returns {Array<string>} List of all regions
 */
function getAllRegions() {
  const regions = Object.values(UNIVERSITY_LOCATIONS).map(loc => loc.region);
  return [...new Set(regions)].sort();
}

/**
 * Get universities by city
 * @param {string} city - City name
 * @returns {Array<string>} List of university names in that city
 */
function getUniversitiesByCity(city) {
  return Object.entries(UNIVERSITY_LOCATIONS)
    .filter(([_, loc]) => loc.city === city)
    .map(([uni, _]) => uni);
}

/**
 * Get universities by region
 * @param {string} region - Region name
 * @returns {Array<string>} List of university names in that region
 */
function getUniversitiesByRegion(region) {
  return Object.entries(UNIVERSITY_LOCATIONS)
    .filter(([_, loc]) => loc.region === region)
    .map(([uni, _]) => uni);
}

module.exports = {
  UNIVERSITY_LOCATIONS,
  getUniversityLocation,
  getAllCities,
  getAllRegions,
  getUniversitiesByCity,
  getUniversitiesByRegion
};
