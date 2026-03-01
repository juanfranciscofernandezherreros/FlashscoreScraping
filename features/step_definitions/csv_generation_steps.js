import { Before, After, Given, When, Then } from '@cucumber/cucumber';
import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  generateCSVData,
  generateCSVDataResults,
  generateCSVPlayerStats,
  generateCSVStatsMatch,
  generateCSVFromObject,
  generateCSVPointByPoint,
  generateCSVOdds,
  generateCSVHeadToHead,
  generateCSVStandings,
  generateCSVLineups,
  generateCSVCountriesAndLeagues,
} from '../../src/csvGenerator.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_DIR = path.join(__dirname, '..', '..', 'src', 'csv', 'cucumber_test');

/** Wait up to 1 s for an async file write to complete with content */
async function waitForFile(filePath, timeoutMs = 1000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (fs.existsSync(filePath) && fs.statSync(filePath).size > 0) return;
    await new Promise((r) => setTimeout(r, 50));
  }
}

// ── World state ─────────────────────────────────────────────────────────────

Before(function () {
  this.data = null;
  this.filePath = null;
  this.csvContent = null;
});

After(function () {
  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true });
  }
});

// ── Background ───────────────────────────────────────────────────────────────

Given('the test output directory is clean', function () {
  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true });
  }
  fs.mkdirSync(TEST_DIR, { recursive: true });
});

// ── Given steps ─────────────────────────────────────────────────────────────

Given('I have match result data with {int} records', function (count) {
  this.data = Array.from({ length: count }, (_, i) => ({
    homeTeam: `Team ${i}`,
    awayTeam: `Rival ${i}`,
    homeScore: String(i * 2),
    awayScore: String(i * 2 + 1),
    date: '2026-01-01',
  }));
});

Given('I have empty data', function () {
  this.data = [];
});

Given('I have basketball match results with {int} records', function (count) {
  this.data = Array.from({ length: count }, (_, i) => ({
    matchId: `match${i}`,
    homeTeam: `Home ${i}`,
    awayTeam: `Away ${i}`,
    homeScore: i * 90,
    awayScore: i * 85,
  }));
});

Given('I have match results data with null fields', function () {
  this.data = [
    { matchId: 'x1', homeTeam: 'A', awayTeam: null, score: null },
  ];
});

Given('I have player stats data with {int} players', function (count) {
  this.data = Array.from({ length: count }, (_, i) => ({
    name: `Player${i + 1}`,
    stats: { PTS: 10 + i, REB: 5 + i, AST: 2 + i },
  }));
});

Given('I have match stats data as CSV rows', function () {
  this.data = '28,Points,30\n10,Rebounds,8\n5,Assists,6';
});

Given('I have a flat object with match summary data', function () {
  this.data = { homeTeam: 'Ajax', awayTeam: 'PSV', homeScore: 2, awayScore: 1 };
});

Given('I have odds data with {int} records', function (count) {
  this.data = Array.from({ length: count }, (_, i) => ({
    market: `1X2_${i}`,
    home: String(1.5 + i),
    draw: '3.20',
    away: String(2.0 + i),
  }));
});

Given('I have empty odds data', function () {
  this.data = [];
});

Given('I have head-to-head data with home and away last matches', function () {
  this.data = {
    homeLastMatches: [
      { date: '2026-01-01', event: 'Liga', homeTeam: 'A', awayTeam: 'B', result: '2-1' },
    ],
    awayLastMatches: [
      { date: '2026-01-02', event: 'Copa', homeTeam: 'C', awayTeam: 'D', result: '0-0' },
    ],
    directMatches: [],
  };
});

Given('I have standings data with {int} teams', function (count) {
  this.data = Array.from({ length: count }, (_, i) => ({
    position: String(i + 1),
    team: `Team ${i + 1}`,
    played: '10',
    points: String(20 - i),
  }));
});

Given('I have lineup data with home and away players', function () {
  this.data = {
    home: [
      { number: '1', name: 'Goalkeeper', position: 'GK' },
      { number: '10', name: 'Striker', position: 'FW' },
    ],
    away: [
      { number: '9', name: 'Forward', position: 'FW' },
    ],
  };
});

Given('I have countries and leagues data with {int} entries', function (count) {
  this.data = Array.from({ length: count }, (_, i) => ({
    country: `Country${i}`,
    league: `League${i}`,
    leagueHref: `/sport/country${i}/league${i}/`,
  }));
});

Given('I have point-by-point data with {int} events', function (count) {
  this.data = Array.from({ length: count }, (_, i) => ({
    time: `${i}'`,
    score: `${i}-${i}`,
    homeIncident: i % 2 === 0 ? 'Goal' : '',
    awayIncident: i % 2 !== 0 ? 'Goal' : '',
  }));
  this.matchId = 'testMatch001';
});

// ── When steps ──────────────────────────────────────────────────────────────

When('I call generateCSVData with a file path', async function () {
  this.filePath = path.join(TEST_DIR, 'test_generateCSVData');
  generateCSVData(this.data, this.filePath);
  if (this.data && this.data.length > 0) {
    await waitForFile(`${this.filePath}.csv`);
  }
});

When('I call generateCSVDataResults with a file path', async function () {
  this.filePath = path.join(TEST_DIR, 'test_generateCSVDataResults');
  generateCSVDataResults(this.data, this.filePath);
  if (this.data && this.data.length > 0) {
    await waitForFile(`${this.filePath}.csv`);
  }
});

When('I call generateCSVPlayerStats with a file path', function () {
  this.filePath = path.join(TEST_DIR, 'test_generateCSVPlayerStats');
  generateCSVPlayerStats(this.data, this.filePath);
});

When('I call generateCSVStatsMatch with a file path', async function () {
  this.filePath = path.join(TEST_DIR, 'test_generateCSVStatsMatch');
  generateCSVStatsMatch(this.data, this.filePath);
  await waitForFile(`${this.filePath}.csv`);
});

When('I call generateCSVFromObject with a file path', function () {
  this.filePath = path.join(TEST_DIR, 'test_generateCSVFromObject');
  generateCSVFromObject(this.data, this.filePath);
});

When('I call generateCSVOdds with a file path', async function () {
  this.filePath = path.join(TEST_DIR, 'test_generateCSVOdds');
  generateCSVOdds(this.data, this.filePath);
  if (this.data && this.data.length > 0) {
    await waitForFile(`${this.filePath}.csv`);
  }
});

When('I call generateCSVHeadToHead with a file path', async function () {
  this.filePath = path.join(TEST_DIR, 'test_generateCSVHeadToHead');
  generateCSVHeadToHead(this.data, this.filePath);
  await waitForFile(`${this.filePath}.csv`);
});

When('I call generateCSVStandings with a file path', async function () {
  this.filePath = path.join(TEST_DIR, 'test_generateCSVStandings');
  generateCSVStandings(this.data, this.filePath);
  if (this.data && this.data.length > 0) {
    await waitForFile(`${this.filePath}.csv`);
  }
});

When('I call generateCSVLineups with a file path', async function () {
  this.filePath = path.join(TEST_DIR, 'test_generateCSVLineups');
  generateCSVLineups(this.data, this.filePath);
  await waitForFile(`${this.filePath}.csv`);
});

When('I call generateCSVCountriesAndLeagues with a file path', async function () {
  this.filePath = path.join(TEST_DIR, 'test_generateCSVCountriesAndLeagues');
  generateCSVCountriesAndLeagues(this.data, this.filePath);
  if (this.data && this.data.length > 0) {
    await waitForFile(`${this.filePath}.csv`);
  }
});

When('I call generateCSVPointByPoint with a file path and match id', async function () {
  this.filePath = path.join(TEST_DIR, 'test_generateCSVPointByPoint');
  generateCSVPointByPoint(this.data, this.filePath, this.matchId);
  await waitForFile(`${this.filePath}.csv`);
});

// ── Then steps ──────────────────────────────────────────────────────────────

Then('a CSV file should exist at that path', async function () {
  await waitForFile(`${this.filePath}.csv`);
  assert.ok(
    fs.existsSync(`${this.filePath}.csv`),
    `Expected CSV file to exist at ${this.filePath}.csv`
  );
  this.csvContent = fs.readFileSync(`${this.filePath}.csv`, 'utf-8');
});

Then('no CSV file should be created', function () {
  assert.ok(
    !fs.existsSync(`${this.filePath}.csv`),
    `Expected no CSV file at ${this.filePath}.csv`
  );
});

Then('the CSV file should contain {int} data rows', function (rowCount) {
  const content = this.csvContent || fs.readFileSync(`${this.filePath}.csv`, 'utf-8');
  const lines = content.split('\n').filter((l) => l.trim().length > 0);
  // Subtract 1 for the header row
  assert.strictEqual(
    lines.length - 1,
    rowCount,
    `Expected ${rowCount} data rows but got ${lines.length - 1}. Content:\n${content}`
  );
});

Then('the CSV file should contain proper headers', function () {
  const content = this.csvContent || fs.readFileSync(`${this.filePath}.csv`, 'utf-8');
  const firstLine = content.split('\n')[0];
  assert.ok(firstLine.length > 0, 'Header row should not be empty');
  assert.ok(
    firstLine.includes('homeTeam') || firstLine.includes('matchId') || firstLine.includes('homeScore'),
    `Expected header row to contain known column names. Got: ${firstLine}`
  );
});

Then('the CSV file should not contain the word {string}', function (word) {
  const content = this.csvContent || fs.readFileSync(`${this.filePath}.csv`, 'utf-8');
  assert.ok(
    !content.includes(word),
    `Expected CSV not to contain "${word}" but it did. Content:\n${content}`
  );
});

Then('the CSV file should contain player names', function () {
  const content = fs.readFileSync(`${this.filePath}.csv`, 'utf-8');
  assert.ok(
    content.includes('Player1') || content.includes('Player'),
    `Expected player names in CSV. Content:\n${content}`
  );
});

Then('the CSV file should contain the stats headers', function () {
  const content = this.csvContent || fs.readFileSync(`${this.filePath}.csv`, 'utf-8');
  assert.ok(
    content.includes('Home Score') && content.includes('Away Score'),
    `Expected stats headers in CSV. Content:\n${content}`
  );
});

Then('the CSV file should have a header row and a value row', function () {
  const content = fs.readFileSync(`${this.filePath}.csv`, 'utf-8');
  const lines = content.split('\n').filter((l) => l.trim().length > 0);
  assert.ok(lines.length >= 2, `Expected at least 2 lines (header + values) in CSV. Got: ${lines.length}`);
});

Then('the CSV file should contain section headers', function () {
  const content = this.csvContent || fs.readFileSync(`${this.filePath}.csv`, 'utf-8');
  assert.ok(
    content.includes('homeLastMatches') || content.includes('awayLastMatches'),
    `Expected section headers in H2H CSV. Content:\n${content}`
  );
});

Then('the CSV file should contain lineup rows for both teams', function () {
  const content = this.csvContent || fs.readFileSync(`${this.filePath}.csv`, 'utf-8');
  assert.ok(content.includes('home'), 'Expected home lineup rows');
  assert.ok(content.includes('away'), 'Expected away lineup rows');
});

Then('the CSV file should contain matchId in every row', function () {
  const content = this.csvContent || fs.readFileSync(`${this.filePath}.csv`, 'utf-8');
  const dataRows = content.split('\n').filter((l) => l.trim().length > 0);
  // Every row (including first data row) should contain the matchId value
  for (const row of dataRows) {
    assert.ok(
      row.includes('testMatch001') || row.includes('matchId'),
      `Expected matchId in row: ${row}`
    );
  }
});
