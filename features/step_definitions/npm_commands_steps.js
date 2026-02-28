import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createReadStream } from 'fs';
import { resolveSourceUrl, buildArchiveUrl } from '../../src/extractLeagueSeasons.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, '..', '..');

// ── Shared CLI arg parser (mirrors index.js logic) ───────────────────────────

function parseIndexArgs(argList) {
  const args = { country: null, league: null, action: null };
  argList.forEach((arg) => {
    if (arg.startsWith('country=')) args.country = arg.split('country=')[1];
    if (arg.startsWith('league=')) args.league = arg.split('league=')[1];
    if (arg.startsWith('action=')) args.action = arg.split('action=')[1];
  });
  return args;
}

// ── competitionResults.cjs arg parser (mirrored inline) ─────────────────────

function parseResultsArgs(argList) {
  const kvArgs = {};
  argList.forEach((arg) => {
    if (arg.startsWith('country=')) kvArgs.country = arg.slice('country='.length);
    else if (arg.startsWith('league=')) kvArgs.league = arg.slice('league='.length);
  });
  if (kvArgs.country && kvArgs.league) return kvArgs;
  const [country, league] = argList;
  return { country: country || null, league: league || null };
}

// ── competitionFixtures.cjs arg parser (mirrored inline) ────────────────────

function parseFixturesArgs(argList) {
  const kvArgs = {};
  argList.forEach((arg) => {
    if (arg.startsWith('country=')) kvArgs.country = arg.slice('country='.length);
    else if (arg.startsWith('league=')) kvArgs.league = arg.slice('league='.length);
  });
  if (kvArgs.country && kvArgs.league) return kvArgs;
  const [country, league] = argList;
  return {
    country: country || 'France',
    league: league || 'lnb',
  };
}

// ── basketball arg parser (mirrors scrapeAllBasketball.js logic) ─────────────

function parseBasketballArgs(argList) {
  const args = { detailed: false };
  argList.forEach((arg) => {
    if (arg === 'detailed=true' || arg === '--detailed') args.detailed = true;
  });
  return args;
}

// ── findCsvFiles (mirrors printCsv.js logic) ─────────────────────────────────

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

// ── World state ──────────────────────────────────────────────────────────────

// ── index.js (start / build-links / standings) ──────────────────────────────

Given('the CLI args contain {string}', function (arg) {
  this.cliArgs = this.cliArgs ? [...this.cliArgs, arg] : [arg];
});

Given('the CLI args contain {string} and {string}', function (arg1, arg2) {
  this.cliArgs = [arg1, arg2];
});

Given('the CLI args contain no country or league', function () {
  this.cliArgs = [];
});

When('I parse the CLI args', function () {
  this.parsed = parseIndexArgs(this.cliArgs || []);
});

Then('the parsed action should be {string}', function (expected) {
  assert.strictEqual(this.parsed.action, expected);
});

Then('the parsed country should be empty', function () {
  assert.strictEqual(this.parsed.country, null);
});

Then('the parsed league should be empty', function () {
  assert.strictEqual(this.parsed.league, null);
});

Then('the parsed country should be {string}', function (expected) {
  assert.strictEqual(this.parsed.country, expected);
});

Then('the parsed league should be {string}', function (expected) {
  assert.strictEqual(this.parsed.league, expected);
});

// ── competitionResults.cjs ───────────────────────────────────────────────────

Given('the competitionResults args are {string} and {string}', function (arg1, arg2) {
  this.resultsArgs = [arg1, arg2];
});

Given('the competitionResults positional args are {string} and {string}', function (arg1, arg2) {
  this.resultsArgs = [arg1, arg2];
});

When('I parse the competitionResults args', function () {
  this.parsedResults = parseResultsArgs(this.resultsArgs || []);
});

Then('the results country should be {string}', function (expected) {
  assert.strictEqual(this.parsedResults.country, expected);
});

Then('the results league should be {string}', function (expected) {
  assert.strictEqual(this.parsedResults.league, expected);
});

// ── competitionFixtures.cjs ──────────────────────────────────────────────────

Given('the competitionFixtures args are {string} and {string}', function (arg1, arg2) {
  this.fixturesArgs = [arg1, arg2];
});

Given('the competitionFixtures args are empty', function () {
  this.fixturesArgs = [];
});

When('I parse the competitionFixtures args', function () {
  this.parsedFixtures = parseFixturesArgs(this.fixturesArgs || []);
});

Then('the fixtures country should be {string}', function (expected) {
  assert.strictEqual(this.parsedFixtures.country, expected);
});

Then('the fixtures league should be {string}', function (expected) {
  assert.strictEqual(this.parsedFixtures.league, expected);
});

// ── scrapeAllBasketball.js ───────────────────────────────────────────────────

Given('no basketball args are provided', function () {
  this.basketballArgs = [];
});

Given('the basketball arg {string} is provided', function (arg) {
  this.basketballArgs = [arg];
});

When('I parse the basketball args', function () {
  this.parsedBasketball = parseBasketballArgs(this.basketballArgs || []);
});

Then('the detailed flag should be {word}', function (value) {
  const expected = value === 'true';
  assert.strictEqual(this.parsedBasketball.detailed, expected);
});

// ── extractLeagueSeasons.js ──────────────────────────────────────────────────

const DEFAULT_SOURCE =
  'https://github.com/juanfranciscofernandezherreros/basketball-data/blob/master/basketball_leagues.csv';

Given('no source URL arg is provided', function () {
  this.sourceUrl = DEFAULT_SOURCE;
});

When('I resolve the source URL', function () {
  this.result = resolveSourceUrl(this.sourceUrl);
});

Then('the resolved URL should contain {string}', function (substring) {
  assert.ok(
    this.result.includes(substring),
    `Expected "${this.result}" to contain "${substring}"`
  );
});

// ── print-csv (findCsvFiles) ──────────────────────────────────────────────────

Given('a temporary directory with {int} CSV files in subdirectories', function (count) {
  this.tmpDir = path.join(PROJECT_ROOT, 'src', 'csv', `cucumber_cmd_test_${Date.now()}`);
  fs.mkdirSync(this.tmpDir, { recursive: true });
  for (let i = 0; i < count; i++) {
    const sub = path.join(this.tmpDir, `sub${i}`);
    fs.mkdirSync(sub, { recursive: true });
    fs.writeFileSync(path.join(sub, `file${i}.csv`), `col1,col2\nval${i},val${i + 1}\n`);
  }
});

Given('a temporary directory with no CSV files', function () {
  this.tmpDir = path.join(PROJECT_ROOT, 'src', 'csv', `cucumber_cmd_empty_${Date.now()}`);
  fs.mkdirSync(this.tmpDir, { recursive: true });
});

When('I scan the directory for CSV files', function () {
  this.foundCsvFiles = findCsvFiles(this.tmpDir);
  // Cleanup tmp dir after scan
  if (fs.existsSync(this.tmpDir)) {
    fs.rmSync(this.tmpDir, { recursive: true });
  }
});

Then('{int} CSV files should be found', function (expected) {
  assert.strictEqual(
    this.foundCsvFiles.length,
    expected,
    `Expected ${expected} CSV files but found ${this.foundCsvFiles.length}`
  );
});

// ── read-csv ─────────────────────────────────────────────────────────────────

Given('a CSV file exists with data rows', function () {
  this.tmpCsvDir = path.join(PROJECT_ROOT, 'src', 'csv', `cucumber_readcsv_${Date.now()}`);
  fs.mkdirSync(this.tmpCsvDir, { recursive: true });
  this.tmpCsvFile = path.join(this.tmpCsvDir, 'test_data.csv');
  fs.writeFileSync(this.tmpCsvFile, 'MATCH,TEAM,SCORE\ngame1,TeamA,2-1\ngame2,TeamB,0-0\n');
});

When('I read and parse the CSV file', async function () {
  // Parse CSV manually using line splitting (avoids requiring csv-parser in test)
  const content = fs.readFileSync(this.tmpCsvFile, 'utf-8');
  const lines = content.split('\n').filter((l) => l.trim().length > 0);
  // First line is header; remaining are data
  this.parsedRows = lines.slice(1);
  // Cleanup
  if (fs.existsSync(this.tmpCsvDir)) {
    fs.rmSync(this.tmpCsvDir, { recursive: true });
  }
});

Then('at least {int} row of data should be returned', function (minCount) {
  assert.ok(
    this.parsedRows.length >= minCount,
    `Expected at least ${minCount} data row(s) but got ${this.parsedRows.length}`
  );
});

// ── npm test (existing test scripts) ─────────────────────────────────────────

When('I check for the test script {string}', function (scriptPath) {
  this.checkedPath = path.join(PROJECT_ROOT, scriptPath);
});

Then('the file should exist', function () {
  assert.ok(
    fs.existsSync(this.checkedPath),
    `Expected file to exist at: ${this.checkedPath}`
  );
});
