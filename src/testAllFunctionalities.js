import fs from 'fs';
import path from 'path';
import {
  generateCSVData,
  generateCSVPlayerStats,
  generateCSVStatsMatch,
  generateCSVDataResults,
  generateCSVPointByPoint,
  generateCSVFromObject,
} from './csvGenerator.js';
import { formatFecha } from './fecha.js';
import { BASE_URL, BASKETBALL_URL } from './constants/index.js';

const TEST_OUTPUT_DIR = path.join(process.cwd(), 'src', 'csv', 'test_all');
const FILE_WRITE_DELAY_MS = 500;

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

function cleanup() {
  if (fs.existsSync(TEST_OUTPUT_DIR)) {
    fs.rmSync(TEST_OUTPUT_DIR, { recursive: true });
  }
}

function setup() {
  cleanup();
  fs.mkdirSync(TEST_OUTPUT_DIR, { recursive: true });
}

// ─── Constants Tests ───────────────────────────────────────────────

function testConstants() {
  console.log('\n--- Test: Constants ---');
  assert(BASE_URL === 'https://www.flashscore.com', `BASE_URL is correct (got ${BASE_URL})`);
  assert(BASKETBALL_URL === 'https://www.flashscore.com/basketball', `BASKETBALL_URL is correct (got ${BASKETBALL_URL})`);
  assert(BASKETBALL_URL.startsWith(BASE_URL), 'BASKETBALL_URL starts with BASE_URL');
}

// ─── formatFecha Tests ─────────────────────────────────────────────

function testFormatFechaBasic() {
  console.log('\n--- Test: formatFecha basic ---');
  const date = new Date(2026, 1, 26, 14, 30, 45); // Feb 26, 2026
  const result = formatFecha(date);
  assert(result === '20260226143045', `formatFecha returns correct timestamp (got ${result})`);
}

function testFormatFechaMidnight() {
  console.log('\n--- Test: formatFecha at midnight ---');
  const date = new Date(2025, 0, 1, 0, 0, 0); // Jan 1, 2025, 00:00:00
  const result = formatFecha(date);
  assert(result === '20250101000000', `formatFecha handles midnight (got ${result})`);
}

function testFormatFechaSingleDigitMonthDay() {
  console.log('\n--- Test: formatFecha with single-digit month and day ---');
  const date = new Date(2025, 2, 5, 9, 3, 7); // Mar 5, 2025, 09:03:07
  const result = formatFecha(date);
  assert(result === '20250305090307', `formatFecha pads single digits (got ${result})`);
}

function testFormatFechaEndOfYear() {
  console.log('\n--- Test: formatFecha end of year ---');
  const date = new Date(2025, 11, 31, 23, 59, 59); // Dec 31, 2025, 23:59:59
  const result = formatFecha(date);
  assert(result === '20251231235959', `formatFecha handles end of year (got ${result})`);
}

function testFormatFechaReturnType() {
  console.log('\n--- Test: formatFecha return type ---');
  const result = formatFecha(new Date());
  assert(typeof result === 'string', 'formatFecha returns a string');
  assert(result.length === 14, `formatFecha returns 14-character string (got ${result.length})`);
  assert(/^\d{14}$/.test(result), 'formatFecha returns only digits');
}

// ─── generateCSVData Tests ─────────────────────────────────────────

async function testGenerateCSVData() {
  console.log('\n--- Test: generateCSVData with basic data ---');
  const data = [
    { name: 'Alice', age: 30, city: 'Madrid' },
    { name: 'Bob', age: 25, city: 'Barcelona' },
  ];
  const filePath = path.join(TEST_OUTPUT_DIR, 'TEST_CSV_DATA');
  generateCSVData(data, filePath);

  await new Promise(resolve => setTimeout(resolve, FILE_WRITE_DELAY_MS));

  const csvPath = `${filePath}.csv`;
  assert(fs.existsSync(csvPath), 'CSV file was created');

  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.trim().split('\n');
  assert(lines[0] === 'name,age,city', `Header row is correct (got ${lines[0]})`);
  assert(lines.length === 3, `CSV has header + 2 data rows (got ${lines.length})`);
  // Values are quoted in generateCSVData
  assert(lines[1].includes('Alice'), 'First row contains Alice');
  assert(lines[2].includes('Bob'), 'Second row contains Bob');
}

async function testGenerateCSVDataEmpty() {
  console.log('\n--- Test: generateCSVData with empty data ---');
  const filePath = path.join(TEST_OUTPUT_DIR, 'TEST_CSV_DATA_EMPTY');
  generateCSVData([], filePath);
  await new Promise(resolve => setTimeout(resolve, FILE_WRITE_DELAY_MS));
  assert(!fs.existsSync(`${filePath}.csv`), 'CSV file is NOT created for empty data');
}

async function testGenerateCSVDataNull() {
  console.log('\n--- Test: generateCSVData with null data ---');
  const filePath = path.join(TEST_OUTPUT_DIR, 'TEST_CSV_DATA_NULL');
  generateCSVData(null, filePath);
  await new Promise(resolve => setTimeout(resolve, FILE_WRITE_DELAY_MS));
  assert(!fs.existsSync(`${filePath}.csv`), 'CSV file is NOT created for null data');
}

async function testGenerateCSVDataQuotesEscaping() {
  console.log('\n--- Test: generateCSVData escapes double quotes ---');
  const data = [{ text: 'He said "hello"' }];
  const filePath = path.join(TEST_OUTPUT_DIR, 'TEST_CSV_DATA_QUOTES');
  generateCSVData(data, filePath);
  await new Promise(resolve => setTimeout(resolve, FILE_WRITE_DELAY_MS));

  const content = fs.readFileSync(`${filePath}.csv`, 'utf-8');
  assert(content.includes('""hello""'), `Double quotes are escaped (got ${content.trim()})`);
}

// ─── generateCSVDataResults Tests ──────────────────────────────────

async function testGenerateCSVDataResults() {
  console.log('\n--- Test: generateCSVDataResults with match data ---');
  const data = [
    { country: 'USA', league: 'NBA', matchId: 'abc', homeTeam: 'Lakers', awayTeam: 'Celtics', homeScore: '110', awayScore: '105' },
    { country: 'SPAIN', league: 'ACB', matchId: 'def', homeTeam: 'Madrid', awayTeam: 'Barca', homeScore: '88', awayScore: '82' },
  ];
  const filePath = path.join(TEST_OUTPUT_DIR, 'TEST_RESULTS');
  generateCSVDataResults(data, filePath);
  await new Promise(resolve => setTimeout(resolve, FILE_WRITE_DELAY_MS));

  const csvPath = `${filePath}.csv`;
  assert(fs.existsSync(csvPath), 'CSV file was created');

  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.trim().split('\n');
  assert(lines[0] === 'country,league,matchId,homeTeam,awayTeam,homeScore,awayScore', 'Header row matches expected columns');
  assert(lines.length === 3, `Has header + 2 rows (got ${lines.length})`);

  const row1 = lines[1].split(',');
  assert(row1[0] === 'USA', 'First row country is USA');
  assert(row1[3] === 'Lakers', 'First row homeTeam is Lakers');
}

async function testGenerateCSVDataResultsNullValues() {
  console.log('\n--- Test: generateCSVDataResults handles null values ---');
  const data = [
    { country: 'USA', league: null, matchId: 'abc', homeTeam: 'Lakers', awayTeam: null },
  ];
  const filePath = path.join(TEST_OUTPUT_DIR, 'TEST_RESULTS_NULL');
  generateCSVDataResults(data, filePath);
  await new Promise(resolve => setTimeout(resolve, FILE_WRITE_DELAY_MS));

  const content = fs.readFileSync(`${filePath}.csv`, 'utf-8');
  const lines = content.trim().split('\n');
  const row = lines[1].split(',');
  // null values should be replaced with empty string
  assert(row[1] === '', `Null league is replaced with empty string (got "${row[1]}")`);
  assert(row[4] === '', `Null awayTeam is replaced with empty string (got "${row[4]}")`);
}

async function testGenerateCSVDataResultsEmpty() {
  console.log('\n--- Test: generateCSVDataResults with empty array ---');
  const filePath = path.join(TEST_OUTPUT_DIR, 'TEST_RESULTS_EMPTY');
  generateCSVDataResults([], filePath);
  await new Promise(resolve => setTimeout(resolve, FILE_WRITE_DELAY_MS));
  assert(!fs.existsSync(`${filePath}.csv`), 'CSV file is NOT created for empty array');
}

// ─── generateCSVPlayerStats Tests ──────────────────────────────────

function testGenerateCSVPlayerStats() {
  console.log('\n--- Test: generateCSVPlayerStats ---');
  const data = [
    { name: 'LeBron James', stats: { TEAM: 'LAL', MIN: '35', PTS: '28', REB: '8', AST: '10' } },
    { name: 'Jayson Tatum', stats: { TEAM: 'BOS', MIN: '38', PTS: '32', REB: '6', AST: '4' } },
  ];
  const filePath = path.join(TEST_OUTPUT_DIR, 'TEST_PLAYER_STATS');
  generateCSVPlayerStats(data, filePath);

  const csvPath = `${filePath}.csv`;
  assert(fs.existsSync(csvPath), 'Player stats CSV file was created');

  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.trim().split('\n');
  assert(lines[0] === 'Name,TEAM,MIN,PTS,REB,AST', `Header row is correct (got ${lines[0]})`);
  assert(lines.length === 3, `Has header + 2 rows (got ${lines.length})`);
  assert(lines[1].startsWith('LeBron James'), 'First row starts with LeBron James');
  assert(lines[2].includes('Jayson Tatum'), 'Second row includes Jayson Tatum');

  // Verify specific values
  const row1 = lines[1].split(',');
  assert(row1[0] === 'LeBron James', 'First player name is correct');
  assert(row1[1] === 'LAL', 'First player team is LAL');
  assert(row1[3] === '28', 'First player PTS is 28');
}

function testGenerateCSVPlayerStatsSinglePlayer() {
  console.log('\n--- Test: generateCSVPlayerStats with single player ---');
  const data = [
    { name: 'Player One', stats: { TEAM: 'TM1', PTS: '15' } },
  ];
  const filePath = path.join(TEST_OUTPUT_DIR, 'TEST_PLAYER_STATS_SINGLE');
  generateCSVPlayerStats(data, filePath);

  const content = fs.readFileSync(`${filePath}.csv`, 'utf-8');
  const lines = content.trim().split('\n');
  assert(lines.length === 2, `Has header + 1 row (got ${lines.length})`);
  assert(lines[0] === 'Name,TEAM,PTS', `Header matches stats keys (got ${lines[0]})`);
}

// ─── generateCSVStatsMatch Tests ───────────────────────────────────

async function testGenerateCSVStatsMatch() {
  console.log('\n--- Test: generateCSVStatsMatch ---');
  const data = '45,Field Goals Made,38\n22,3-Point Field Goals,18\n15,Free Throws,12';
  const filePath = path.join(TEST_OUTPUT_DIR, 'TEST_STATS_MATCH');
  generateCSVStatsMatch(data, filePath);
  await new Promise(resolve => setTimeout(resolve, FILE_WRITE_DELAY_MS));

  const csvPath = `${filePath}.csv`;
  assert(fs.existsSync(csvPath), 'Stats match CSV file was created');

  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.trim().split('\n');
  assert(lines[0] === 'Home Score,Category,Away Score', `Header row is correct (got ${lines[0]})`);
  assert(lines.length === 4, `Has header + 3 rows (got ${lines.length})`);
  assert(lines[1] === '45,Field Goals Made,38', 'First data row is correct');
}

async function testGenerateCSVStatsMatchEmptyData() {
  console.log('\n--- Test: generateCSVStatsMatch with empty string ---');
  const filePath = path.join(TEST_OUTPUT_DIR, 'TEST_STATS_MATCH_EMPTY');
  generateCSVStatsMatch('', filePath);
  await new Promise(resolve => setTimeout(resolve, FILE_WRITE_DELAY_MS));

  const content = fs.readFileSync(`${filePath}.csv`, 'utf-8');
  assert(content.startsWith('Home Score,Category,Away Score'), 'Header row still present for empty data');
}

// ─── generateCSVPointByPoint Tests ─────────────────────────────────

async function testGenerateCSVPointByPoint() {
  console.log('\n--- Test: generateCSVPointByPoint ---');
  const data = [
    { score: '2 - 0' },
    { score: '2 - 3' },
    { score: '5 - 3' },
    { score: '7 - 3' },
  ];
  const filePath = path.join(TEST_OUTPUT_DIR, 'TEST_POINT_BY_POINT');
  const matchId = 'g_3_test123';
  generateCSVPointByPoint(data, filePath, matchId);
  await new Promise(resolve => setTimeout(resolve, FILE_WRITE_DELAY_MS));

  const csvPath = `${filePath}.csv`;
  assert(fs.existsSync(csvPath), 'Point-by-point CSV file was created');

  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.trim().split('\n');
  assert(lines.length === 4, `Has 4 data rows (got ${lines.length})`);
  assert(lines[0] === 'g_3_test123,2 - 0', `First row has matchId and score (got ${lines[0]})`);
  assert(lines[3] === 'g_3_test123,7 - 3', `Last row is correct (got ${lines[3]})`);
}

async function testGenerateCSVPointByPointEmptyData() {
  console.log('\n--- Test: generateCSVPointByPoint with empty array ---');
  const filePath = path.join(TEST_OUTPUT_DIR, 'TEST_POINT_BY_POINT_EMPTY');
  generateCSVPointByPoint([], filePath, 'test_id');
  await new Promise(resolve => setTimeout(resolve, FILE_WRITE_DELAY_MS));

  const csvPath = `${filePath}.csv`;
  assert(fs.existsSync(csvPath), 'CSV file is created (empty content)');
  const content = fs.readFileSync(csvPath, 'utf-8');
  assert(content === '', `Content is empty (got "${content}")`);
}

// ─── generateCSVFromObject Tests ───────────────────────────────────

function testGenerateCSVFromObject() {
  console.log('\n--- Test: generateCSVFromObject ---');
  const data = {
    date: '01.01.2025 20:00',
    home: { name: 'Lakers', image: 'http://example.com/lakers.png' },
    away: { name: 'Celtics', image: 'http://example.com/celtics.png' },
    result: { home: '110', away: '105' },
    totalLocal: '110',
    firstLocal: '28',
  };
  const filePath = path.join(TEST_OUTPUT_DIR, 'TEST_FROM_OBJECT');
  generateCSVFromObject(data, filePath);

  const csvPath = `${filePath}.csv`;
  assert(fs.existsSync(csvPath), 'Object CSV file was created');

  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.trim().split('\n');
  assert(lines.length === 2, `Has header + 1 data row (got ${lines.length})`);

  const headers = lines[0].split(',');
  assert(headers.includes('date'), 'Headers include "date"');
  assert(headers.includes('home_name'), 'Nested object flattened: headers include "home_name"');
  assert(headers.includes('home_image'), 'Nested object flattened: headers include "home_image"');
  assert(headers.includes('away_name'), 'Headers include "away_name"');
  assert(headers.includes('result_home'), 'Headers include "result_home"');
  assert(headers.includes('result_away'), 'Headers include "result_away"');
  assert(headers.includes('totalLocal'), 'Headers include "totalLocal"');
  assert(headers.includes('firstLocal'), 'Headers include "firstLocal"');

  const values = lines[1].split(',');
  const dateIdx = headers.indexOf('date');
  assert(values[dateIdx] === '01.01.2025 20:00', `Date value is correct (got ${values[dateIdx]})`);
  const homeNameIdx = headers.indexOf('home_name');
  assert(values[homeNameIdx] === 'Lakers', `home_name value is Lakers (got ${values[homeNameIdx]})`);
}

function testGenerateCSVFromObjectFlat() {
  console.log('\n--- Test: generateCSVFromObject with flat object ---');
  const data = { a: '1', b: '2', c: '3' };
  const filePath = path.join(TEST_OUTPUT_DIR, 'TEST_FROM_OBJECT_FLAT');
  generateCSVFromObject(data, filePath);

  const content = fs.readFileSync(`${filePath}.csv`, 'utf-8');
  const lines = content.trim().split('\n');
  assert(lines[0] === 'a,b,c', `Headers for flat object (got ${lines[0]})`);
  assert(lines[1] === '1,2,3', `Values for flat object (got ${lines[1]})`);
}

// ─── CLI Argument Parsing Tests ────────────────────────────────────

function testCliArgumentParsing() {
  console.log('\n--- Test: CLI argument parsing logic ---');

  // Simulate the argument parsing logic from index.js
  function parseArgs(argv) {
    const args = {
      country: null,
      ids: null,
      league: null,
      competition: null,
      action: null,
      includeMatchData: false,
      includeStatsPlayer: false,
      includeStatsMatch: false,
      includePointByPoint: false,
    };
    argv.forEach(arg => {
      if (arg.startsWith("country=")) args.country = arg.split("country=")[1];
      if (arg.startsWith("ids=")) args.ids = arg.split("ids=")[1];
      if (arg.startsWith("league=")) args.league = arg.split("league=")[1];
      if (arg.startsWith("competition=")) args.competition = arg.split("competition=")[1];
      if (arg.startsWith("action=")) args.action = arg.split("action=")[1];
      if (arg === "includeMatchData=true") args.includeMatchData = true;
      if (arg === "includeStatsPlayer=true") args.includeStatsPlayer = true;
      if (arg === "includeStatsMatch=true") args.includeStatsMatch = true;
      if (arg === "includePointByPoint=true") args.includePointByPoint = true;
    });
    return args;
  }

  // Test full argument set
  const args1 = parseArgs([
    'country=spain', 'league=acb', 'action=results',
    'includeMatchData=true', 'includeStatsPlayer=true',
    'includeStatsMatch=true', 'includePointByPoint=true',
  ]);
  assert(args1.country === 'spain', 'Parses country=spain');
  assert(args1.league === 'acb', 'Parses league=acb');
  assert(args1.action === 'results', 'Parses action=results');
  assert(args1.includeMatchData === true, 'Parses includeMatchData=true');
  assert(args1.includeStatsPlayer === true, 'Parses includeStatsPlayer=true');
  assert(args1.includeStatsMatch === true, 'Parses includeStatsMatch=true');
  assert(args1.includePointByPoint === true, 'Parses includePointByPoint=true');

  // Test ids parsing
  const args2 = parseArgs(['ids=g_3_abc,g_3_def', 'includeMatchData=true']);
  assert(args2.ids === 'g_3_abc,g_3_def', 'Parses comma-separated ids');
  assert(args2.includeMatchData === true, 'Parses includeMatchData with ids');
  assert(args2.country === null, 'Country is null when not provided');

  // Test empty arguments
  const args3 = parseArgs([]);
  assert(args3.country === null, 'Country is null for empty args');
  assert(args3.action === null, 'Action is null for empty args');
  assert(args3.includeMatchData === false, 'includeMatchData defaults to false');

  // Test fixtures action
  const args4 = parseArgs(['country=usa', 'league=nba', 'action=fixtures']);
  assert(args4.action === 'fixtures', 'Parses action=fixtures');
  assert(args4.includePointByPoint === false, 'includePointByPoint defaults to false');

  // Test competition name
  const args5 = parseArgs(['country=spain', 'league=acb', 'competition=liga_endesa_2024', 'action=results']);
  assert(args5.competition === 'liga_endesa_2024', 'Parses competition name');

  // Test folder name derivation (from index.js logic)
  const folderName5 = args5.competition ? args5.competition : `${args5.country}_${args5.league}`;
  assert(folderName5 === 'liga_endesa_2024', 'Folder name uses competition when provided');

  const args6 = parseArgs(['country=spain', 'league=acb', 'action=results']);
  const folderName6 = args6.competition ? args6.competition : `${args6.country}_${args6.league}`;
  assert(folderName6 === 'spain_acb', 'Folder name uses country_league when no competition');
}

// ─── Integration-style Tests ───────────────────────────────────────

async function testFullResultsWorkflow() {
  console.log('\n--- Test: Full results CSV workflow ---');
  const mockData = [
    {
      country: 'GERMANY', league: 'BBL', matchId: 'xyz001',
      eventTime: '18:00', homeTeam: 'Bayern Munich', awayTeam: 'Alba Berlin',
      homeScore: '92', awayScore: '87',
      homeScore1: '24', homeScore2: '22', homeScore3: '23', homeScore4: '23', homeScore5: '',
      awayScore1: '20', awayScore2: '25', awayScore3: '21', awayScore4: '21', awayScore5: '',
    },
  ];

  const fechaActual = new Date();
  const formattedFecha = formatFecha(fechaActual);
  const nombreArchivo = path.join(TEST_OUTPUT_DIR, `RESULTS_${formattedFecha}_germany_bbl`);
  generateCSVDataResults(mockData, nombreArchivo);

  await new Promise(resolve => setTimeout(resolve, FILE_WRITE_DELAY_MS));

  const csvPath = `${nombreArchivo}.csv`;
  assert(fs.existsSync(csvPath), 'Results workflow CSV file created');
  assert(path.basename(csvPath).startsWith('RESULTS_'), 'File name starts with RESULTS_');
  assert(path.basename(csvPath).includes('germany_bbl'), 'File name includes country_league');

  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.trim().split('\n');
  assert(lines.length === 2, 'Has header + 1 data row');

  const row = lines[1].split(',');
  assert(row[0] === 'GERMANY', 'Country is GERMANY');
  assert(row[4] === 'Bayern Munich', 'Home team is Bayern Munich');
}

async function testMatchSummaryCSVFromObject() {
  console.log('\n--- Test: Match summary CSV from getMatchData-style object ---');
  const matchData = {
    date: '15.01.2025 20:30',
    home: { name: 'Real Madrid', image: 'https://example.com/rm.png' },
    away: { name: 'Barcelona', image: 'https://example.com/fcb.png' },
    result: { home: '95', away: '88' },
    totalLocal: '95',
    firstLocal: '24',
    secondLocal: '22',
    thirstLocal: '26',
    fourthLocal: '23',
    extraLocal: undefined,
    totalAway: '88',
    firstAway: '20',
    secondAway: '24',
    thirstAway: '22',
    fourthAway: '22',
    extraAway: undefined,
  };

  const filePath = path.join(TEST_OUTPUT_DIR, 'TEST_MATCH_SUMMARY');
  generateCSVFromObject(matchData, filePath);

  const csvPath = `${filePath}.csv`;
  assert(fs.existsSync(csvPath), 'Match summary CSV created');

  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',');
  assert(headers.includes('home_name'), 'Has home_name header');
  assert(headers.includes('result_home'), 'Has result_home header');
  assert(headers.includes('totalLocal'), 'Has totalLocal header');
  assert(headers.includes('firstLocal'), 'Has firstLocal header');
}

// ─── Run All Tests ─────────────────────────────────────────────────

(async () => {
  console.log('=== Comprehensive Project Functionality Tests ===');
  setup();

  try {
    // Constants
    testConstants();

    // formatFecha
    testFormatFechaBasic();
    testFormatFechaMidnight();
    testFormatFechaSingleDigitMonthDay();
    testFormatFechaEndOfYear();
    testFormatFechaReturnType();

    // generateCSVData
    await testGenerateCSVData();
    await testGenerateCSVDataEmpty();
    await testGenerateCSVDataNull();
    await testGenerateCSVDataQuotesEscaping();

    // generateCSVDataResults
    await testGenerateCSVDataResults();
    await testGenerateCSVDataResultsNullValues();
    await testGenerateCSVDataResultsEmpty();

    // generateCSVPlayerStats
    testGenerateCSVPlayerStats();
    testGenerateCSVPlayerStatsSinglePlayer();

    // generateCSVStatsMatch
    await testGenerateCSVStatsMatch();
    await testGenerateCSVStatsMatchEmptyData();

    // generateCSVPointByPoint
    await testGenerateCSVPointByPoint();
    await testGenerateCSVPointByPointEmptyData();

    // generateCSVFromObject
    testGenerateCSVFromObject();
    testGenerateCSVFromObjectFlat();

    // CLI argument parsing
    testCliArgumentParsing();

    // Integration-style tests
    await testFullResultsWorkflow();
    await testMatchSummaryCSVFromObject();
  } finally {
    cleanup();
  }

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);

  if (failed > 0) {
    process.exit(1);
  }
})();
