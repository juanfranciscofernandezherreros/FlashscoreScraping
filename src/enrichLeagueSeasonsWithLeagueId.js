#!/usr/bin/env node

/**
 * Uso:
 * node src/enrichLeagueSeasonsWithLeagueId.js \
 *   leaguesSource=basketball-data/basketball_leagues.csv \
 *   seasonsSource=src/csv/BASKETBALL_LEAGUE_SEASONS.csv \
 *   output=src/csv/BASKETBALL_LEAGUE_SEASONS_WITH_LEAGUE_ID
 */

const fs = require("fs");
const path = require("path");

function getArg(name) {
  const arg = process.argv.find(a => a.startsWith(name + "="));
  if (!arg) {
    console.error(`Missing argument: ${name}`);
    process.exit(1);
  }
  return arg.split("=")[1];
}

function normalize(text) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")   // quitar tildes
    .replace(/[^a-zA-Z0-9]+/g, "_")   // espacios y símbolos → _
    .replace(/^_|_$/g, "")            // trim _
    .toUpperCase();
}

function parseTSV(content) {
  const lines = content.trim().split("\n");
  const headers = lines[0].split("\t");
  return lines.slice(1).map(line => {
    const values = line.split("\t");
    const obj = {};
    headers.forEach((h, i) => {
      obj[h.trim()] = (values[i] || "").trim();
    });
    return obj;
  });
}

function parseCSV(content) {
  const lines = content.trim().split("\n");
  const headers = lines[0].split(",");
  return lines.slice(1).map(line => {
    const values = line.split(",");
    const obj = {};
    headers.forEach((h, i) => {
      obj[h.trim()] = (values[i] || "").trim();
    });
    return obj;
  });
}

function toCSV(rows, headers) {
  const lines = [];
  lines.push(headers.join(","));
  rows.forEach(row => {
    lines.push(headers.map(h => row[h] ?? "").join(","));
  });
  return lines.join("\n");
}

// -----------------------

const leaguesSource = getArg("leaguesSource");
const seasonsSource = getArg("seasonsSource");
const output = getArg("output");

if (!fs.existsSync(leaguesSource)) {
  console.error(`Leagues source not found: ${leaguesSource}`);
  process.exit(1);
}

if (!fs.existsSync(seasonsSource)) {
  console.error(`Seasons source not found: ${seasonsSource}`);
  process.exit(1);
}

const leaguesRaw = fs.readFileSync(leaguesSource, "utf8");
const seasonsRaw = fs.readFileSync(seasonsSource, "utf8");

// Tu basketball_leagues.csv es TAB separado
const leagues = parseTSV(leaguesRaw);

// seasons lo asumimos CSV normal separado por coma
const seasons = parseCSV(seasonsRaw);

// Mapa por País+Liga
const leagueMap = new Map();

leagues.forEach(row => {
  const key = `${row["País"]}||${row["Liga"]}`;
  leagueMap.set(key, row["ID"]);
});

const enriched = [];

seasons.forEach(row => {
  const pais = row["País"] || row["Pais"] || row["PAIS"];
  const liga = row["Liga"] || row["LIGA"];

  const key = `${pais}||${liga}`;
  const originalId = leagueMap.get(key);

  if (!originalId) {
    console.warn(`No ID found for ${pais} - ${liga}`);
    return;
  }

  const newId = `${originalId}.${normalize(pais)}_${normalize(liga)}`;

  enriched.push({
    ID: newId,
    ORIGINAL_ID: originalId,
    PAIS: pais,
    LIGA: liga,
    SEASON: row["Season"] || row["SEASON"]
  });
});

// Orden opcional
enriched.sort((a, b) => a.ID.localeCompare(b.ID));

const outputPath = output.endsWith(".csv") ? output : output + ".csv";

fs.writeFileSync(
  outputPath,
  toCSV(enriched, ["ID", "ORIGINAL_ID", "PAIS", "LIGA", "SEASON"])
);

console.log(`Created ${outputPath} with ${enriched.length} rows`);
