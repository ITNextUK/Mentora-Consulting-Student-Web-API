const line = "Chamilka Ambagahawatta";
const lineLower = line.toLowerCase();

const isDegree = (lineLower.includes('bachelor') || lineLower.includes('master') || 
                 lineLower.includes('phd') || lineLower.includes('diploma'));

const wordCount = line.split(/\s+/).length;
const isJustName = /^[A-Z][a-z]+\s[A-Z][a-z]+$/.test(line.trim());

console.log(`Line: "${line}"`);
console.log(`isDegree: ${isDegree}`);
console.log(`Word count: ${wordCount}`);
console.log(`Matches name pattern: ${isJustName}`);
console.log(`Full condition: ${!isDegree && wordCount === 2 && isJustName}`);
