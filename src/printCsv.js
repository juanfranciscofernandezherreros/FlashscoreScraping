import fs from 'fs';
import path from 'path';

/**
 * Recursively find all CSV files under a directory.
 */
function findCsvFiles(dir) {
  const csvFiles = [];
  if (!fs.existsSync(dir)) return csvFiles;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      csvFiles.push(...findCsvFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.csv')) {
      csvFiles.push(fullPath);
    }
  }
  return csvFiles;
}

/**
 * Print CSV file contents to console with a header.
 */
function printCsvFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const relativePath = path.relative(process.cwd(), filePath);
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📄 ${relativePath}`);
  console.log('='.repeat(80));
  console.log(content);
}

// Main: scan src/csv directory and print all CSV files
const csvDir = path.join(process.cwd(), 'src', 'csv');
const csvFiles = findCsvFiles(csvDir);

if (csvFiles.length === 0) {
  console.log('No CSV files found in src/csv/');
} else {
  console.log(`\n🔍 Found ${csvFiles.length} CSV file(s) in src/csv/\n`);
  for (const file of csvFiles) {
    printCsvFile(file);
  }
  console.log(`\n✅ Printed ${csvFiles.length} CSV file(s) to console.`);
}
