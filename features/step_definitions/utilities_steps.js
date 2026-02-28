import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'assert';
import { formatFecha } from '../../src/fecha.js';
import { BASE_URL, BASKETBALL_URL } from '../../src/constants/index.js';
import {
  resolveSourceUrl,
  buildArchiveUrl,
  filterSeasonEntries,
} from '../../src/extractLeagueSeasons.js';
import {
  getStatsMatchButtonXPath,
  getStatsMatchPeriodCandidates,
} from '../../src/utils/index.js';

// ── formatFecha ──────────────────────────────────────────────────────────────

Given('I have a date of {string}', function (dateStr) {
  // Parse "YYYY-MM-DD HH:mm:ss"
  const [datePart, timePart] = dateStr.split(' ');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes, seconds] = timePart.split(':').map(Number);
  this.date = new Date(year, month - 1, day, hours, minutes, seconds);
});

Given('I have any valid date', function () {
  this.date = new Date(2026, 5, 15, 12, 0, 0);
});

When('I call formatFecha', function () {
  this.result = formatFecha(this.date);
});

Then('the result should be {string}', function (expected) {
  assert.strictEqual(this.result, expected);
});

Then('the result should equal {string}', function (expected) {
  assert.strictEqual(this.result, expected);
});

Then('the result should be a 14-character string of digits', function () {
  assert.strictEqual(typeof this.result, 'string');
  assert.strictEqual(this.result.length, 14, `Expected 14 chars, got ${this.result.length}`);
  assert.match(this.result, /^\d{14}$/, `Expected only digits, got ${this.result}`);
});

// ── Constants ────────────────────────────────────────────────────────────────

When('I read the BASE_URL constant', function () {
  this.result = BASE_URL;
});

Then('it should equal {string}', function (expected) {
  assert.strictEqual(this.result, expected);
});

When('I read the BASKETBALL_URL constant', function () {
  this.result = BASKETBALL_URL;
});

Then('it should start with BASE_URL', function () {
  assert.ok(
    this.result.startsWith(BASE_URL),
    `Expected "${this.result}" to start with "${BASE_URL}"`
  );
});

// ── resolveSourceUrl ─────────────────────────────────────────────────────────

Given('I have a GitHub blob URL {string}', function (url) {
  this.inputUrl = url;
});

Given('I have a direct URL {string}', function (url) {
  this.inputUrl = url;
});

When('I call resolveSourceUrl', function () {
  this.result = resolveSourceUrl(this.inputUrl);
});

// "the result should equal X" is already covered by the shared step above

// ── buildArchiveUrl ──────────────────────────────────────────────────────────

Given('I have a league href {string}', function (href) {
  this.leagueHref = href;
});

Given('I have an empty league href', function () {
  this.leagueHref = '';
});

When('I call buildArchiveUrl', function () {
  this.result = buildArchiveUrl(this.leagueHref);
});

Then('the result should end with {string}', function (suffix) {
  assert.ok(
    this.result.endsWith(suffix),
    `Expected "${this.result}" to end with "${suffix}"`
  );
});

Then('the result should start with {string}', function (prefix) {
  assert.ok(
    this.result.startsWith(prefix),
    `Expected "${this.result}" to start with "${prefix}"`
  );
});

Then('the result should be an empty string', function () {
  assert.strictEqual(this.result, '');
});

// ── filterSeasonEntries ──────────────────────────────────────────────────────

Given('I have season entries including valid years and invalid entries', function () {
  this.entries = [
    { text: '2023/2024', href: '/season/2023-2024/' },
    { text: 'Archive', href: '/archive/' },
    { text: '2022', href: '/season/2022/' },
    { text: '', href: '/season/empty/' },
    { text: '2021-2022', href: '/season/2021-2022/' },
  ];
});

Given('I have season entries with duplicate hrefs', function () {
  this.entries = [
    { text: '2023/2024', href: '/season/2023/' },
    { text: '2023/2024 copy', href: '/season/2023/' },
    { text: '2022/2023', href: '/season/2022/' },
  ];
});

When('I call filterSeasonEntries', function () {
  this.result = filterSeasonEntries(this.entries);
});

Then('only entries with season year patterns should be returned', function () {
  const seasonPattern = /\b\d{4}(?:[/-]\d{4})?\b/;
  for (const entry of this.result) {
    assert.ok(
      seasonPattern.test(entry.season),
      `Entry "${entry.season}" does not match season pattern`
    );
  }
  // Also verify that "Archive" and empty entries were removed
  const seasons = this.result.map((e) => e.season);
  assert.ok(!seasons.includes('Archive'), 'Archive entry should be filtered out');
  assert.ok(!seasons.includes(''), 'Empty entry should be filtered out');
});

Then('duplicate href entries should be removed', function () {
  const hrefs = this.result.map((e) => e.seasonHref);
  const uniqueHrefs = new Set(hrefs);
  assert.strictEqual(
    hrefs.length,
    uniqueHrefs.size,
    `Expected unique hrefs but got duplicates: ${hrefs}`
  );
});

// ── getStatsMatchButtonXPath / getStatsMatchPeriodCandidates ─────────────────

When('I call getStatsMatchButtonXPath with index {int}', function (index) {
  this.result = getStatsMatchButtonXPath(index);
});

When('I call getStatsMatchPeriodCandidates with index {int}', function (index) {
  this.result = getStatsMatchPeriodCandidates(index);
});

Then('the result should include {string}', function (value) {
  assert.ok(
    Array.isArray(this.result) ? this.result.includes(value) : this.result === value,
    `Expected result to include "${value}". Got: ${JSON.stringify(this.result)}`
  );
});
