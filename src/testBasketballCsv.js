import fs from 'fs';
import path from 'path';
import { generateCSVDataResults } from './csvGenerator.js';
import { formatFecha } from './fecha.js';

const TEST_OUTPUT_DIR = path.join(process.cwd(), 'src', 'csv', 'test_results');

// Sample data matching the structure returned by getAllBasketballResults
const mockBasketballData = [
  {
    country: 'USA',
    league: 'NBA',
    matchId: 'abc123',
    eventTime: '20:00',
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
    matchId: 'def456',
    eventTime: '21:30',
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
    matchId: 'ghi789',
    eventTime: '19:00',
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
  await new Promise(resolve => setTimeout(resolve, 500));

  const csvPath = `${filePath}.csv`;
  assert(fs.existsSync(csvPath), 'CSV file was created');

  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.trim().split('\n');

  // Check header row
  const expectedHeaders = 'country,league,matchId,eventTime,homeTeam,awayTeam,homeScore,awayScore,homeScore1,homeScore2,homeScore3,homeScore4,homeScore5,awayScore1,awayScore2,awayScore3,awayScore4,awayScore5';
  assert(lines[0] === expectedHeaders, 'CSV header row matches expected columns');

  // Check number of data rows (3 matches)
  assert(lines.length === 4, `CSV has header + 3 data rows (got ${lines.length} lines)`);

  // Check first match data
  assert(lines[1].includes('USA'), 'First row contains country USA');
  assert(lines[1].includes('NBA'), 'First row contains league NBA');
  assert(lines[1].includes('Los Angeles Lakers'), 'First row contains home team');
  assert(lines[1].includes('Boston Celtics'), 'First row contains away team');
  assert(lines[1].includes('110'), 'First row contains home score');
  assert(lines[1].includes('105'), 'First row contains away score');

  // Check second match
  assert(lines[2].includes('SPAIN'), 'Second row contains country SPAIN');
  assert(lines[2].includes('Real Madrid'), 'Second row contains Real Madrid');
  assert(lines[2].includes('FC Barcelona'), 'Second row contains FC Barcelona');

  // Check third match (overtime game)
  assert(lines[3].includes('Euroleague'), 'Third row contains Euroleague');
  assert(lines[3].includes('Olympiacos'), 'Third row contains Olympiacos');
  assert(lines[3].includes('10'), 'Third row contains OT home score');
  assert(lines[3].includes('8'), 'Third row contains OT away score');

  console.log(`\n  CSV content preview:\n${lines.slice(0, 4).map(l => '    ' + l).join('\n')}`);
}

async function testEmptyData() {
  console.log('\n--- Test: generateCSVDataResults with empty data ---');
  
  const filePath = path.join(TEST_OUTPUT_DIR, 'TEST_EMPTY');
  generateCSVDataResults([], filePath);
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const csvPath = `${filePath}.csv`;
  assert(!fs.existsSync(csvPath), 'CSV file is NOT created for empty data');
}

async function testNullData() {
  console.log('\n--- Test: generateCSVDataResults with null data ---');
  
  const filePath = path.join(TEST_OUTPUT_DIR, 'TEST_NULL');
  generateCSVDataResults(null, filePath);
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
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
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const csvPath = `${nombreArchivo}.csv`;
  assert(fs.existsSync(csvPath), `Timestamped CSV file was created: ${path.basename(csvPath)}`);
  
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.trim().split('\n');
  assert(lines.length === 4, `Timestamped CSV has correct number of rows (${lines.length})`);
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
  } finally {
    cleanup();
  }

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
  
  if (failed > 0) {
    process.exit(1);
  }
})();
