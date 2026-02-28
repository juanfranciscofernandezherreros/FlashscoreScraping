import fs from 'fs';
import path from 'path';
import {
  generateCSVData,
  generateCSVPlayerStats,
  generateCSVStatsMatch,
  generateCSVDataResults,
  generateCSVPointByPoint,
  generateCSVFromObject,
  generateCSVOdds,
  generateCSVHeadToHead,
  generateCSVStandings,
  generateCSVLineups,
  generateCSVCountriesAndLeagues,
} from './csvGenerator.js';
import { formatFecha } from './fecha.js';
import { BASE_URL, BASKETBALL_URL } from './constants/index.js';
import { getStatsMatchButtonXPath, getStatsMatchPeriodCandidates } from './utils/index.js';

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
  assert(
    getStatsMatchButtonXPath(4) === '//*[@id="detail"]/div[4]/div[1]/div/a[5]/button',
    'Stats match xpath maps index 4 to a[5]/button'
  );
  const overtimeCandidates = getStatsMatchPeriodCandidates(4);
  assert(
    overtimeCandidates.includes('OT'),
    'Stats match fallback candidates for index 4 include OT'
  );
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
    { time: '09:53', score: '2 - 0', homeIncident: '2PT Field Goal', awayIncident: '' },
    { time: '08:44', score: '2 - 3', homeIncident: '', awayIncident: '3PT Field Goal' },
    { time: '07:20', score: '5 - 3', homeIncident: '3PT Field Goal', awayIncident: '' },
    { time: '05:10', score: '7 - 3', homeIncident: '2PT Field Goal', awayIncident: '' },
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
  assert(lines[0] === '"g_3_test123","09:53","2 - 0","2PT Field Goal",""', `First row has all point-by-point fields (got ${lines[0]})`);
  assert(lines[1] === '"g_3_test123","08:44","2 - 3","","3PT Field Goal"', `Second row is correct (got ${lines[1]})`);
  assert(lines[2] === '"g_3_test123","07:20","5 - 3","3PT Field Goal",""', `Third row is correct (got ${lines[2]})`);
  assert(lines[3] === '"g_3_test123","05:10","7 - 3","2PT Field Goal",""', `Last row is correct (got ${lines[3]})`);
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
  function parseArgs(argv, env = {}) {
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
      includeOdds: false,
      includeH2H: false,
      includeStandings: false,
      includeLineups: false,
      includeAll: false,
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
      if (arg === "includeOdds=true") args.includeOdds = true;
      if (arg === "includeH2H=true") args.includeH2H = true;
      if (arg === "includeStandings=true") args.includeStandings = true;
      if (arg === "includeLineups=true") args.includeLineups = true;
      if (arg === "includeAll=true") args.includeAll = true;
    });
    args.country = args.country ?? env.npm_config_country ?? null;
    args.ids = args.ids ?? env.npm_config_ids ?? null;
    args.league = args.league ?? env.npm_config_league ?? null;
    args.competition = args.competition ?? env.npm_config_competition ?? null;
    args.action = args.action ?? env.npm_config_action ?? null;
    if (!args.includeMatchData && env.npm_config_includematchdata === "true") args.includeMatchData = true;
    if (!args.includeStatsPlayer && env.npm_config_includestatsplayer === "true") args.includeStatsPlayer = true;
    if (!args.includeStatsMatch && env.npm_config_includestatsmatch === "true") args.includeStatsMatch = true;
    if (!args.includePointByPoint && env.npm_config_includepointbypoint === "true") args.includePointByPoint = true;
    if (!args.includeOdds && env.npm_config_includeodds === "true") args.includeOdds = true;
    if (!args.includeH2H && env.npm_config_includeh2h === "true") args.includeH2H = true;
    if (!args.includeStandings && env.npm_config_includestandings === "true") args.includeStandings = true;
    if (!args.includeLineups && env.npm_config_includelineups === "true") args.includeLineups = true;
    if (!args.includeAll && env.npm_config_includeall === "true") args.includeAll = true;
    if (args.includeAll) {
      args.includeMatchData = true;
      args.includeStatsPlayer = true;
      args.includeStatsMatch = true;
      args.includePointByPoint = true;
      args.includeOdds = true;
      args.includeH2H = true;
      args.includeLineups = true;
      args.includeStandings = true;
    }
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
  const folderName6 = args6.competition ? args6.competition : (args6.country && args6.league ? `${args6.country}_${args6.league}` : 'general');
  assert(folderName6 === 'spain_acb', 'Folder name uses country_league when no competition');

  const args6b = parseArgs([]);
  const folderName6b = args6b.competition ? args6b.competition : (args6b.country && args6b.league ? `${args6b.country}_${args6b.league}` : 'general');
  assert(folderName6b === 'general', 'Folder name falls back to general when country/league are missing');

  // Test new include flags
  const args7 = parseArgs([
    'country=spain', 'league=acb', 'action=results',
    'includeOdds=true', 'includeH2H=true', 'includeStandings=true', 'includeLineups=true',
  ]);
  assert(args7.includeOdds === true, 'Parses includeOdds=true');
  assert(args7.includeH2H === true, 'Parses includeH2H=true');
  assert(args7.includeStandings === true, 'Parses includeStandings=true');
  assert(args7.includeLineups === true, 'Parses includeLineups=true');

  // Test includeAll flag
  const args8 = parseArgs(['country=spain', 'league=acb', 'action=results', 'includeAll=true']);
  assert(args8.includeAll === true, 'Parses includeAll=true');
  assert(args8.includeMatchData === true, 'includeAll enables includeMatchData');
  assert(args8.includeStatsPlayer === true, 'includeAll enables includeStatsPlayer');
  assert(args8.includeStatsMatch === true, 'includeAll enables includeStatsMatch');
  assert(args8.includePointByPoint === true, 'includeAll enables includePointByPoint');
  assert(args8.includeOdds === true, 'includeAll enables includeOdds');
  assert(args8.includeH2H === true, 'includeAll enables includeH2H');
  assert(args8.includeLineups === true, 'includeAll enables includeLineups');
  assert(args8.includeStandings === true, 'includeAll enables includeStandings');

  // Test standings action
  const args9 = parseArgs(['country=spain', 'league=acb', 'action=standings']);
  assert(args9.action === 'standings', 'Parses action=standings');

  // Test new flags default to false
  const args10 = parseArgs([]);
  assert(args10.includeOdds === false, 'includeOdds defaults to false');
  assert(args10.includeH2H === false, 'includeH2H defaults to false');
  assert(args10.includeStandings === false, 'includeStandings defaults to false');
  assert(args10.includeLineups === false, 'includeLineups defaults to false');
  assert(args10.includeAll === false, 'includeAll defaults to false');

  const args11 = parseArgs([], {
    npm_config_country: 'spain',
    npm_config_league: 'acb',
    npm_config_action: 'results',
    npm_config_ids: 'g_3_Uix0vJJK',
    npm_config_includematchdata: 'true',
    npm_config_includestatsplayer: 'true',
    npm_config_includestatsmatch: 'true',
    npm_config_includepointbypoint: 'true',
    npm_config_includeall: 'true',
  });
  assert(args11.country === 'spain', 'Reads country from npm_config_country');
  assert(args11.league === 'acb', 'Reads league from npm_config_league');
  assert(args11.action === 'results', 'Reads action from npm_config_action');
  assert(args11.ids === 'g_3_Uix0vJJK', 'Reads ids from npm_config_ids');
  assert(args11.includeMatchData === true, 'Reads includeMatchData from npm_config_includematchdata');
  assert(args11.includeStatsPlayer === true, 'Reads includeStatsPlayer from npm_config_includestatsplayer');
  assert(args11.includeStatsMatch === true, 'Reads includeStatsMatch from npm_config_includestatsmatch');
  assert(args11.includePointByPoint === true, 'Reads includePointByPoint from npm_config_includepointbypoint');
  assert(args11.includeAll === true, 'Reads includeAll from npm_config_includeall');
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
    status: 'Finished',
    venue: 'WiZink Center, Madrid',
    referee: 'John Smith',
    attendance: '12500',
    round: 'Round 15',
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
  assert(headers.includes('status'), 'Has status header');
  assert(headers.includes('venue'), 'Has venue header');
  assert(headers.includes('referee'), 'Has referee header');
  assert(headers.includes('attendance'), 'Has attendance header');
  assert(headers.includes('round'), 'Has round header');
}

// ─── generateCSVOdds Tests ─────────────────────────────────────────

async function testGenerateCSVOdds() {
  console.log('\n--- Test: generateCSVOdds with odds data ---');
  const data = [
    { bookmaker: 'Bet365', odd1: '1.50', oddX: '4.00', odd2: '2.80' },
    { bookmaker: 'Bwin', odd1: '1.55', oddX: '3.90', odd2: '2.70' },
  ];
  const filePath = path.join(TEST_OUTPUT_DIR, 'TEST_ODDS');
  generateCSVOdds(data, filePath);
  await new Promise(resolve => setTimeout(resolve, FILE_WRITE_DELAY_MS));

  const csvPath = `${filePath}.csv`;
  assert(fs.existsSync(csvPath), 'Odds CSV file was created');

  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.trim().split('\n');
  assert(lines[0] === 'bookmaker,odd1,oddX,odd2', `Odds header row is correct (got ${lines[0]})`);
  assert(lines.length === 3, `Odds CSV has header + 2 rows (got ${lines.length})`);
  assert(lines[1].includes('Bet365'), 'First row contains Bet365');
}

async function testGenerateCSVOddsEmpty() {
  console.log('\n--- Test: generateCSVOdds with empty data ---');
  const filePath = path.join(TEST_OUTPUT_DIR, 'TEST_ODDS_EMPTY');
  generateCSVOdds([], filePath);
  await new Promise(resolve => setTimeout(resolve, FILE_WRITE_DELAY_MS));
  assert(!fs.existsSync(`${filePath}.csv`), 'Odds CSV NOT created for empty data');
}

// ─── generateCSVHeadToHead Tests ───────────────────────────────────

async function testGenerateCSVHeadToHead() {
  console.log('\n--- Test: generateCSVHeadToHead with H2H data ---');
  const data = {
    homeLastMatches: [
      { date: '01.01.2025', event: 'ACB', homeTeam: 'Real Madrid', awayTeam: 'Baskonia', result: '90 - 85' },
    ],
    awayLastMatches: [
      { date: '02.01.2025', event: 'ACB', homeTeam: 'Barcelona', awayTeam: 'Valencia', result: '88 - 82' },
    ],
    directMatches: [
      { date: '15.12.2024', event: 'ACB', homeTeam: 'Real Madrid', awayTeam: 'Barcelona', result: '92 - 88' },
    ],
  };
  const filePath = path.join(TEST_OUTPUT_DIR, 'TEST_H2H');
  generateCSVHeadToHead(data, filePath);
  await new Promise(resolve => setTimeout(resolve, FILE_WRITE_DELAY_MS));

  const csvPath = `${filePath}.csv`;
  assert(fs.existsSync(csvPath), 'H2H CSV file was created');

  const content = fs.readFileSync(csvPath, 'utf-8');
  assert(content.includes('homeLastMatches'), 'H2H CSV contains homeLastMatches section');
  assert(content.includes('awayLastMatches'), 'H2H CSV contains awayLastMatches section');
  assert(content.includes('directMatches'), 'H2H CSV contains directMatches section');
  assert(content.includes('Real Madrid'), 'H2H CSV contains Real Madrid');
}

async function testGenerateCSVHeadToHeadNull() {
  console.log('\n--- Test: generateCSVHeadToHead with null ---');
  const filePath = path.join(TEST_OUTPUT_DIR, 'TEST_H2H_NULL');
  generateCSVHeadToHead(null, filePath);
  await new Promise(resolve => setTimeout(resolve, FILE_WRITE_DELAY_MS));
  assert(!fs.existsSync(`${filePath}.csv`), 'H2H CSV NOT created for null data');
}

// ─── generateCSVStandings Tests ────────────────────────────────────

async function testGenerateCSVStandings() {
  console.log('\n--- Test: generateCSVStandings with standings data ---');
  const data = [
    { rank: '1', team: 'Real Madrid', W: '15', L: '3', PTS: '33' },
    { rank: '2', team: 'Barcelona', W: '14', L: '4', PTS: '32' },
    { rank: '3', team: 'Baskonia', W: '12', L: '6', PTS: '30' },
  ];
  const filePath = path.join(TEST_OUTPUT_DIR, 'TEST_STANDINGS');
  generateCSVStandings(data, filePath);
  await new Promise(resolve => setTimeout(resolve, FILE_WRITE_DELAY_MS));

  const csvPath = `${filePath}.csv`;
  assert(fs.existsSync(csvPath), 'Standings CSV file was created');

  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.trim().split('\n');
  assert(lines[0] === 'rank,team,W,L,PTS', `Standings header row is correct (got ${lines[0]})`);
  assert(lines.length === 4, `Standings CSV has header + 3 rows (got ${lines.length})`);
  assert(lines[1].includes('Real Madrid'), 'First row contains Real Madrid');
}

async function testGenerateCSVStandingsEmpty() {
  console.log('\n--- Test: generateCSVStandings with empty data ---');
  const filePath = path.join(TEST_OUTPUT_DIR, 'TEST_STANDINGS_EMPTY');
  generateCSVStandings([], filePath);
  await new Promise(resolve => setTimeout(resolve, FILE_WRITE_DELAY_MS));
  assert(!fs.existsSync(`${filePath}.csv`), 'Standings CSV NOT created for empty data');
}

// ─── generateCSVLineups Tests ──────────────────────────────────────

async function testGenerateCSVLineups() {
  console.log('\n--- Test: generateCSVLineups with lineup data ---');
  const data = {
    home: [
      { number: '7', name: 'Luka Doncic', position: 'G' },
      { number: '23', name: 'Sergio Llull', position: 'G' },
    ],
    away: [
      { number: '11', name: 'Juan Hernangomez', position: 'F' },
    ],
  };
  const filePath = path.join(TEST_OUTPUT_DIR, 'TEST_LINEUPS');
  generateCSVLineups(data, filePath);
  await new Promise(resolve => setTimeout(resolve, FILE_WRITE_DELAY_MS));

  const csvPath = `${filePath}.csv`;
  assert(fs.existsSync(csvPath), 'Lineups CSV file was created');

  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.trim().split('\n');
  assert(lines[0] === 'team,number,name,position', `Lineups header is correct (got ${lines[0]})`);
  assert(lines.length === 4, `Lineups CSV has header + 3 rows (got ${lines.length})`);
  assert(lines[1].includes('home'), 'First data row is home team');
  assert(lines[1].includes('Luka Doncic'), 'First data row includes Luka Doncic');
  assert(lines[3].includes('away'), 'Third data row is away team');
}

async function testGenerateCSVLineupsEmpty() {
  console.log('\n--- Test: generateCSVLineups with empty data ---');
  const filePath = path.join(TEST_OUTPUT_DIR, 'TEST_LINEUPS_EMPTY');
  generateCSVLineups({ home: [], away: [] }, filePath);
  await new Promise(resolve => setTimeout(resolve, FILE_WRITE_DELAY_MS));
  assert(!fs.existsSync(`${filePath}.csv`), 'Lineups CSV NOT created for empty data');
}

async function testGenerateCSVLineupsNull() {
  console.log('\n--- Test: generateCSVLineups with null ---');
  const filePath = path.join(TEST_OUTPUT_DIR, 'TEST_LINEUPS_NULL');
  generateCSVLineups(null, filePath);
  await new Promise(resolve => setTimeout(resolve, FILE_WRITE_DELAY_MS));
  assert(!fs.existsSync(`${filePath}.csv`), 'Lineups CSV NOT created for null data');
}

// ─── Countries & Leagues CSV Tests ─────────────────────────────────

async function testGenerateCSVCountriesAndLeagues() {
  console.log('\n--- Test: generateCSVCountriesAndLeagues with data ---');
  const filePath = path.join(TEST_OUTPUT_DIR, 'TEST_COUNTRIES_LEAGUES');
  const mockData = [
    { country: 'USA', countryHref: '/basketball/usa/', league: 'NBA', leagueHref: '/basketball/usa/nba/' },
    { country: 'USA', countryHref: '/basketball/usa/', league: 'WNBA', leagueHref: '/basketball/usa/wnba/' },
    { country: 'SPAIN', countryHref: '/basketball/spain/', league: 'ACB', leagueHref: '/basketball/spain/acb/' },
  ];
  generateCSVCountriesAndLeagues(mockData, filePath);
  await new Promise(resolve => setTimeout(resolve, FILE_WRITE_DELAY_MS));
  const csvPath = `${filePath}.csv`;
  assert(fs.existsSync(csvPath), 'Countries & Leagues CSV file was created');
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.trim().split('\n');
  assert(lines[0] === 'country,countryHref,league,leagueHref', 'Header row is correct (got ' + lines[0] + ')');
  assert(lines.length === 4, `CSV has header + 3 data rows (got ${lines.length})`);
  assert(lines[1].includes('USA'), 'First row contains USA');
  assert(lines[1].includes('/basketball/usa/nba/'), 'First row contains NBA href');
  assert(lines[3].includes('SPAIN'), 'Third row contains SPAIN');
  assert(lines[3].includes('/basketball/spain/acb/'), 'Third row contains ACB href');
}

async function testGenerateCSVCountriesAndLeaguesEmpty() {
  console.log('\n--- Test: generateCSVCountriesAndLeagues with empty data ---');
  const filePath = path.join(TEST_OUTPUT_DIR, 'TEST_COUNTRIES_LEAGUES_EMPTY');
  generateCSVCountriesAndLeagues([], filePath);
  await new Promise(resolve => setTimeout(resolve, FILE_WRITE_DELAY_MS));
  assert(!fs.existsSync(`${filePath}.csv`), 'Countries & Leagues CSV NOT created for empty data');
}

async function testGenerateCSVCountriesAndLeaguesNull() {
  console.log('\n--- Test: generateCSVCountriesAndLeagues with null ---');
  const filePath = path.join(TEST_OUTPUT_DIR, 'TEST_COUNTRIES_LEAGUES_NULL');
  generateCSVCountriesAndLeagues(null, filePath);
  await new Promise(resolve => setTimeout(resolve, FILE_WRITE_DELAY_MS));
  assert(!fs.existsSync(`${filePath}.csv`), 'Countries & Leagues CSV NOT created for null data');
}

// ─── CSV Data Summary Tests ────────────────────────────────────────

async function testCSVDataSummaryForResults() {
  console.log('\n--- Test: CSV data summary is logged for generateCSVDataResults ---');
  const filePath = path.join(TEST_OUTPUT_DIR, 'TEST_SUMMARY_RESULTS');
  const logs = [];
  const origLog = console.log;
  console.log = (...args) => { logs.push(args.join(' ')); origLog(...args); };
  generateCSVDataResults([
    { country: 'USA', league: 'NBA', homeTeam: 'Lakers', awayTeam: 'Celtics' },
  ], filePath);
  await new Promise(resolve => setTimeout(resolve, FILE_WRITE_DELAY_MS));
  console.log = origLog;
  const summaryLog = logs.find(l => l.includes('📊'));
  assert(!!summaryLog, 'Data summary log is printed after CSV generation');
  assert(summaryLog.includes('1 record'), 'Summary includes correct record count');
  assert(summaryLog.includes('4 columns'), 'Summary includes correct column count');
}

async function testCSVDataSummaryForPlayerStats() {
  console.log('\n--- Test: CSV data summary is logged for generateCSVPlayerStats ---');
  const filePath = path.join(TEST_OUTPUT_DIR, 'TEST_SUMMARY_PLAYER_STATS');
  const logs = [];
  const origLog = console.log;
  console.log = (...args) => { logs.push(args.join(' ')); origLog(...args); };
  generateCSVPlayerStats([
    { name: 'Player1', stats: { PTS: 20, REB: 5 } },
    { name: 'Player2', stats: { PTS: 15, REB: 8 } },
  ], filePath);
  console.log = origLog;
  const summaryLog = logs.find(l => l.includes('📊'));
  assert(!!summaryLog, 'Data summary log is printed for player stats');
  assert(summaryLog.includes('2 records'), 'Summary includes correct record count for player stats');
  assert(summaryLog.includes('3 columns'), 'Summary includes correct column count for player stats');
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

    // New CSV generators
    await testGenerateCSVOdds();
    await testGenerateCSVOddsEmpty();
    await testGenerateCSVHeadToHead();
    await testGenerateCSVHeadToHeadNull();
    await testGenerateCSVStandings();
    await testGenerateCSVStandingsEmpty();
    await testGenerateCSVLineups();
    await testGenerateCSVLineupsEmpty();
    await testGenerateCSVLineupsNull();

    // Countries & Leagues CSV
    await testGenerateCSVCountriesAndLeagues();
    await testGenerateCSVCountriesAndLeaguesEmpty();
    await testGenerateCSVCountriesAndLeaguesNull();

    // CSV data summary tests
    await testCSVDataSummaryForResults();
    await testCSVDataSummaryForPlayerStats();
  } finally {
    cleanup();
  }

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);

  if (failed > 0) {
    process.exit(1);
  }
})();
