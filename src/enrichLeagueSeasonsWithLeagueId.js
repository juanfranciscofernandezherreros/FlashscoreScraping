import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';

const getFirstValue = (row, keys) => {
  for (const key of keys) {
    const value = row?.[key];
    if (value !== undefined && value !== null && String(value).trim()) {
      return String(value).trim();
    }
  }
  return '';
};

const normalizeValue = (value) => String(value || '').trim().toLowerCase();
const buildKey = (country, league) => `${normalizeValue(country)}|||${normalizeValue(league)}`;

export const readCsvRows = (csvPath) => new Promise((resolve, reject) => {
  const rows = [];
  fs.createReadStream(csvPath)
    .pipe(csv())
    .on('data', (row) => rows.push(row))
    .on('end', () => resolve(rows))
    .on('error', reject);
});

export const buildLeagueIdMap = (leagueRows) => {
  const idMap = new Map();
  leagueRows.forEach((row) => {
    const country = getFirstValue(row, ['country', 'Country', 'país', 'País', 'pais', 'Pais']);
    const league = getFirstValue(row, ['league', 'League', 'liga', 'Liga']);
    const leagueId = getFirstValue(row, ['LEAGUE_ID', 'league_id', 'leagueId', 'id', 'ID']);
    if (!country || !league || !leagueId) return;
    idMap.set(buildKey(country, league), leagueId);
  });
  return idMap;
};

const escapeCsvValue = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

export const enrichSeasonsWithLeagueId = (seasonRows, leagueIdMap) => (
  seasonRows.map((row) => {
    const country = getFirstValue(row, ['country', 'Country', 'país', 'País', 'pais', 'Pais']);
    const league = getFirstValue(row, ['league', 'League', 'liga', 'Liga']);
    const key = buildKey(country, league);
    return {
      ...row,
      LEAGUE_ID: leagueIdMap.get(key) || '',
    };
  })
);

export const writeCsvRows = (rows, outputWithoutExtension) => {
  if (!rows.length) {
    throw new Error('No rows available to generate enriched CSV.');
  }
  const headers = Object.keys(rows[0]);
  const csvData = [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => escapeCsvValue(row[header])).join(',')),
  ].join('\n');

  const outputPath = `${outputWithoutExtension}.csv`;
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, csvData, 'utf8');
  return outputPath;
};

const parseArgs = () => {
  const args = {
    leaguesSource: '',
    seasonsSource: '',
    output: '',
  };

  process.argv.slice(2).forEach((arg) => {
    if (arg.startsWith('leaguesSource=')) args.leaguesSource = arg.slice('leaguesSource='.length);
    if (arg.startsWith('seasonsSource=')) args.seasonsSource = arg.slice('seasonsSource='.length);
    if (arg.startsWith('output=')) args.output = arg.slice('output='.length);
  });

  return args;
};

const run = async () => {
  const { leaguesSource, seasonsSource, output } = parseArgs();
  if (!leaguesSource || !seasonsSource || !output) {
    throw new Error('Required args: leaguesSource=<path> seasonsSource=<path> output=<path_without_extension>');
  }

  const [leagueRows, seasonRows] = await Promise.all([
    readCsvRows(leaguesSource),
    readCsvRows(seasonsSource),
  ]);

  const leagueIdMap = buildLeagueIdMap(leagueRows);
  const enrichedRows = enrichSeasonsWithLeagueId(seasonRows, leagueIdMap);
  const writtenPath = writeCsvRows(enrichedRows, output);
  console.log(`Enriched CSV generated: ${writtenPath}`);
};

if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch((error) => {
    console.error('Error enriching seasons CSV with LEAGUE_ID:', error.message);
    process.exit(1);
  });
}
