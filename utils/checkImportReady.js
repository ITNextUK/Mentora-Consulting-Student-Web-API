const fs = require('fs');
const path = require('path');

console.log('🔍 Checking import-data folder...\n');

const importDir = path.join(__dirname, '..', 'import-data');

if (!fs.existsSync(importDir)) {
  console.log('❌ import-data folder does not exist');
  console.log('Creating it now...\n');
  fs.mkdirSync(importDir, { recursive: true });
  console.log('✅ Created import-data folder at:', importDir);
  console.log('\n📝 Next steps:');
  console.log('   1. Place your Excel files (.xlsx) in:', importDir);
  console.log('   2. Run: node utils/importUniversityCourses.js\n');
} else {
  const files = fs.readdirSync(importDir);
  const excelFiles = files.filter(f => f.endsWith('.xlsx') || f.endsWith('.xls'));
  
  console.log('📁 Import folder exists:', importDir);
  console.log(`\n📊 Found ${excelFiles.length} Excel file(s):\n`);
  
  if (excelFiles.length > 0) {
    excelFiles.forEach((file, index) => {
      const filePath = path.join(importDir, file);
      const stats = fs.statSync(filePath);
      const sizeKB = (stats.size / 1024).toFixed(2);
      console.log(`   ${index + 1}. ${file} (${sizeKB} KB)`);
    });
    console.log('\n✅ Ready to import!');
    console.log('   Run: node utils/importUniversityCourses.js\n');
  } else {
    console.log('   ⚠️  No Excel files found');
    console.log('\n📝 Next steps:');
    console.log('   1. Place your Excel files (.xlsx) in:', importDir);
    console.log('   2. Run this script again to verify');
    console.log('   3. Then run: node utils/importUniversityCourses.js\n');
  }
}
