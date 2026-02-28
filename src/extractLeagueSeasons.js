import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import puppeteer from 'puppeteer';
import { Readable } from 'stream';
import { BASE_URL } from './constants/index.js';
import { formatFecha } from './fecha.js';
import { generateCSVData } from './csvGenerator.js';

const DEFAULT_SOURCE = 'https://github.com/juanfranciscofernandezherreros/basketball-data/blob/master/basketball_leagues.csv';
const ARCHIVE_PAGE_LOAD_DELAY_MS = 1200;

export const resolveSourceUrl = (source) => {
  try {
    const parsed = new URL(source);
    if (parsed.hostname !== 'github.com') return source;
    const parts = parsed.pathname.split('/').filter(Boolean);
    if (parts.length < 5 || parts[2] !== 'blob') return source;
    const [owner, repo, , ref, ...fileParts] = parts;
    return `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${fileParts.join('/')}`;
  } catch {
    return source;
  }
};

export const buildArchiveUrl = (leagueHref) => {
  const cleanHref = String(leagueHref || '').trim();
  if (!cleanHref) return '';
  const absolute = cleanHref.startsWith('http')
    ? cleanHref
    : `${BASE_URL}${cleanHref.startsWith('/') ? '' : '/'}${cleanHref}`;
  const withTrailingSlash = absolute.replace(/\/+$/, '') + '/';
  return withTrailingSlash.endsWith('/archive/')
    ? withTrailingSlash
    : `${withTrailingSlash}archive/`;
};

export const filterSeasonEntries = (entries) => {
  const seasonPattern = /\b\d{4}(?:[/-]\d{4})?\b/;
  const seen = new Set();
  return entries
    .map((entry) => ({
      season: String(entry.text || '').trim(),
      seasonHref: String(entry.href || '').trim(),
    }))
    .filter((entry) => entry.season && entry.seasonHref && seasonPattern.test(entry.season))
    .filter((entry) => {
      if (seen.has(entry.seasonHref)) return false;
      seen.add(entry.seasonHref);
      return true;
    });
};

export const getLeagueHref = (row) => {
  if (!row || typeof row !== 'object') return '';
  const direct = row.leagueHref || row.leaguehref || row.href || row.link || row.url || row.URL || '';
  if (direct) return direct;
  const match = Object.entries(row).find(([key, value]) => (
    /league.*href|href|url|link/i.test(key) && String(value || '').includes('/basketball/')
  ));
  return match ? match[1] : '';
};

const parseCsvFromReadable = (readable) => new Promise((resolve, reject) => {
  const rows = [];
  readable
    .pipe(csv())
    .on('data', (row) => rows.push(row))
    .on('end', () => resolve(rows))
    .on('error', reject);
});

const readLeagueRows = async (source) => {
  const resolved = resolveSourceUrl(source);
  if (/^https?:\/\//i.test(resolved)) {
    const response = await fetch(resolved);
    if (!response.ok) {
      throw new Error(`Could not download CSV from ${resolved}: HTTP ${response.status}`);
    }
    const text = await response.text();
    return parseCsvFromReadable(Readable.from([text]));
  }

  const absolutePath = path.isAbsolute(resolved) ? resolved : path.join(process.cwd(), resolved);
  return parseCsvFromReadable(fs.createReadStream(absolutePath));
};

const extractSeasons = async (browser, archiveUrl) => {
  const page = await browser.newPage();
  try {
    await page.goto(archiveUrl, { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise((resolve) => setTimeout(resolve, ARCHIVE_PAGE_LOAD_DELAY_MS));
    const rawEntries = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a[href]')).map((a) => ({
        text: a.textContent || '',
        href: a.href || '',
      }));
    });
    return filterSeasonEntries(rawEntries);
  } finally {
    await page.close();
  }
};

const run = async () => {
  const args = {
    source: DEFAULT_SOURCE,
    output: '',
  };

  process.argv.slice(2).forEach((arg) => {
    if (arg.startsWith('source=')) args.source = arg.split('source=')[1];
    if (arg.startsWith('output=')) args.output = arg.split('output=')[1];
  });

  const rows = await readLeagueRows(args.source);
  const disableSandbox = process.env.PUPPETEER_DISABLE_SANDBOX === 'true' || process.env.CI === 'true';
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: disableSandbox ? ['--no-sandbox', '--disable-setuid-sandbox'] : [],
  });

  try {
    const output = [];
    for (const row of rows) {
      const leagueHref = getLeagueHref(row);
      if (!leagueHref) continue;
      const archiveUrl = buildArchiveUrl(leagueHref);
      if (!archiveUrl) continue;
      console.log(`Processing archive URL: ${archiveUrl}`);
      const seasons = await extractSeasons(browser, archiveUrl);
      seasons.forEach((season) => {
        output.push({
          country: row.country || row.Country || row.país || row.País || row.pais || row.Pais || '',
          league: row.league || row.League || row.liga || row.Liga || '',
          leagueHref,
          archiveUrl,
          season: season.season,
          seasonHref: season.seasonHref,
        });
      });
    }

    const fileName = args.output || path.join(
      process.cwd(),
      'src',
      'csv',
      `BASKETBALL_LEAGUE_SEASONS_${formatFecha(new Date())}`,
    );
    generateCSVData(output, fileName);
    console.log(`League seasons CSV generated: ${fileName}.csv`);
  } finally {
    await browser.close();
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch((error) => {
    console.error('Error extracting league seasons:', error.message);
    process.exit(1);
  });
}
