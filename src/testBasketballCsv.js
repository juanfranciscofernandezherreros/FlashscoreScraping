import fs from 'fs';
import path from 'path';
import { generateCSVDataResults } from './csvGenerator.js';
import { formatFecha } from './fecha.js';

const TEST_OUTPUT_DIR = path.join(process.cwd(), 'src', 'csv', 'test_results');
const FILE_WRITE_DELAY_MS = 500;

// Sample data matching the structure returned by getAllBasketballResults
const mockBasketballData = [
  {
    country: 'USA',
    league: 'NBA',
    competition: 'NBA',
    round: 'Regular Season',
    matchId: 'abc123',
    eventTime: '20:00',
    state: 'Final',
    matchStatus: 'Final',
    result: '110-105',
    homeTeam: 'Los Angeles Lakers',
    awayTeam: 'Boston Celtics',
    homeScore: '110',
    awayScore: '105',
    homeScore1: '28',
    homeScore2: '30',
    homeScore3: '25',
    homeScore4: '27',
    homeScore5: '',
    awayScore1: '26',
    awayScore2: '29',
    awayScore3: '24',
    awayScore4: '26',
    awayScore5: '',
  },
  {
    country: 'SPAIN',
    league: 'ACB',
    competition: 'ACB',
    round: 'Round 12',
    matchId: 'def456',
    eventTime: '21:30',
    state: 'Final',
    matchStatus: 'Final',
    result: '88-82',
    homeTeam: 'Real Madrid',
    awayTeam: 'FC Barcelona',
    homeScore: '88',
    awayScore: '82',
    homeScore1: '22',
    homeScore2: '20',
    homeScore3: '24',
    homeScore4: '22',
    homeScore5: '',
    awayScore1: '18',
    awayScore2: '21',
    awayScore3: '23',
    awayScore4: '20',
    awayScore5: '',
  },
  {
    country: 'EUROPE',
    league: 'Euroleague',
    competition: 'Euroleague',
    round: 'Playoffs',
    matchId: 'ghi789',
    eventTime: '19:00',
    state: 'Final OT',
    matchStatus: 'Final OT',
    result: '95-93',
    homeTeam: 'Olympiacos',
    awayTeam: 'Panathinaikos',
    homeScore: '95',
    awayScore: '93',
    homeScore1: '20',
    homeScore2: '22',
    homeScore3: '18',
    homeScore4: '25',
    homeScore5: '10',
    awayScore1: '22',
    awayScore2: '20',
    awayScore3: '20',
    awayScore4: '23',
    awayScore5: '8',
  },
];

function cleanup() {
  if (fs.existsSync(TEST_OUTPUT_DIR)) {
    fs.rmSync(TEST_OUTPUT_DIR, { recursive: true });
  }
}

function setup() {
  cleanup();
  fs.mkdirSync(TEST_OUTPUT_DIR, { recursive: true });
}

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function testGenerateCSVDataResults() {
  console.log('\n--- Test: generateCSVDataResults with basketball data ---');
  
  const filePath = path.join(TEST_OUTPUT_DIR, 'TEST_BASKETBALL_RESULTS');
  generateCSVDataResults(mockBasketballData, filePath);

  // generateCSVDataResults uses fs.writeFile (async callback), wait for it
  await new Promise(resolve => setTimeout(resolve, FILE_WRITE_DELAY_MS));

  const csvPath = `${filePath}.csv`;
  assert(fs.existsSync(csvPath), 'CSV file was created');

  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.trim().split('\n');

  // Check header row
  const expectedHeaders = 'country,league,competition,round,matchId,eventTime,state,matchStatus,result,homeTeam,awayTeam,homeScore,awayScore,homeScore1,homeScore2,homeScore3,homeScore4,homeScore5,awayScore1,awayScore2,awayScore3,awayScore4,awayScore5';
  assert(lines[0] === expectedHeaders, 'CSV header row matches expected columns');

  // Check number of data rows (3 matches)
  assert(lines.length === 4, `CSV has header + 3 data rows (got ${lines.length} lines)`);

  // Parse CSV rows into columns for precise validation
  const row1 = lines[1].split(',');
  const row2 = lines[2].split(',');
  const row3 = lines[3].split(',');

  // Check first match data by column index
  assert(row1[0] === 'USA', 'First row column 0 is country USA');
  assert(row1[1] === 'NBA', 'First row column 1 is league NBA');
  assert(row1[2] === 'NBA', 'First row column 2 is competition NBA');
  assert(row1[6] === 'Final', 'First row column 6 is state Final');
  assert(row1[8] === '110-105', 'First row column 8 is result 110-105');
  assert(row1[9] === 'Los Angeles Lakers', 'First row column 9 is home team');
  assert(row1[10] === 'Boston Celtics', 'First row column 10 is away team');
  assert(row1[11] === '110', 'First row column 11 is home score 110');
  assert(row1[12] === '105', 'First row column 12 is away score 105');

  // Check second match by column index
  assert(row2[0] === 'SPAIN', 'Second row column 0 is country SPAIN');
  assert(row2[9] === 'Real Madrid', 'Second row column 9 is Real Madrid');
  assert(row2[10] === 'FC Barcelona', 'Second row column 10 is FC Barcelona');

  // Check third match (overtime game) by column index
  assert(row3[1] === 'Euroleague', 'Third row column 1 is Euroleague');
  assert(row3[9] === 'Olympiacos', 'Third row column 9 is Olympiacos');
  assert(row3[17] === '10', 'Third row column 17 (homeScore5) is OT score 10');
  assert(row3[22] === '8', 'Third row column 22 (awayScore5) is OT score 8');

  console.log(`\n  CSV content preview:\n${lines.slice(0, 4).map(l => '    ' + l).join('\n')}`);
}

async function testEmptyData() {
  console.log('\n--- Test: generateCSVDataResults with empty data ---');
  
  const filePath = path.join(TEST_OUTPUT_DIR, 'TEST_EMPTY');
  generateCSVDataResults([], filePath);
  
  await new Promise(resolve => setTimeout(resolve, FILE_WRITE_DELAY_MS));
  
  const csvPath = `${filePath}.csv`;
  assert(!fs.existsSync(csvPath), 'CSV file is NOT created for empty data');
}

async function testNullData() {
  console.log('\n--- Test: generateCSVDataResults with null data ---');
  
  const filePath = path.join(TEST_OUTPUT_DIR, 'TEST_NULL');
  generateCSVDataResults(null, filePath);
  
  await new Promise(resolve => setTimeout(resolve, FILE_WRITE_DELAY_MS));
  
  const csvPath = `${filePath}.csv`;
  assert(!fs.existsSync(csvPath), 'CSV file is NOT created for null data');
}

async function testFormatFecha() {
  console.log('\n--- Test: formatFecha ---');

  const date = new Date(2026, 1, 26, 14, 30, 45); // Feb 26, 2026, 14:30:45
  const result = formatFecha(date);
  assert(result === '20260226143045', `formatFecha returns correct timestamp (got ${result})`);
}

async function testCsvFilePathWithTimestamp() {
  console.log('\n--- Test: CSV file path uses timestamp ---');
  
  const fechaActual = new Date();
  const formattedFecha = formatFecha(fechaActual);
  const nombreArchivo = path.join(TEST_OUTPUT_DIR, `ALL_BASKETBALL_RESULTS_${formattedFecha}`);
  
  generateCSVDataResults(mockBasketballData, nombreArchivo);
  
  await new Promise(resolve => setTimeout(resolve, FILE_WRITE_DELAY_MS));
  
  const csvPath = `${nombreArchivo}.csv`;
  assert(fs.existsSync(csvPath), `Timestamped CSV file was created: ${path.basename(csvPath)}`);
  
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.trim().split('\n');
  assert(lines.length === 4, `Timestamped CSV has correct number of rows (${lines.length})`);
}

async function testAutoCreateDirectory() {
  console.log('\n--- Test: generateCSVDataResults auto-creates directory ---');

  const deepDir = path.join(TEST_OUTPUT_DIR, 'auto_created', 'nested', 'dir');
  const filePath = path.join(deepDir, 'TEST_AUTO_DIR');

  assert(!fs.existsSync(deepDir), 'Nested directory does not exist before CSV generation');

  generateCSVDataResults(mockBasketballData, filePath);

  await new Promise(resolve => setTimeout(resolve, FILE_WRITE_DELAY_MS));

  const csvPath = `${filePath}.csv`;
  assert(fs.existsSync(deepDir), 'Nested directory was auto-created');
  assert(fs.existsSync(csvPath), 'CSV file was created in auto-created directory');

  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.trim().split('\n');
  assert(lines.length === 4, `CSV has header + 3 data rows in auto-created dir (got ${lines.length} lines)`);
}

// Run all tests
(async () => {
  console.log('=== Basketball CSV Generation Tests ===\n');
  setup();

  try {
    await testGenerateCSVDataResults();
    await testEmptyData();
    await testNullData();
    await testFormatFecha();
    await testCsvFilePathWithTimestamp();
    await testAutoCreateDirectory();
  } finally {
    cleanup();
  }

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
  
  if (failed > 0) {
    process.exit(1);
  }
})();
