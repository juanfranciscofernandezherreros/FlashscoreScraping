import fs from 'fs';
import path from 'path';
import puppeteer from "puppeteer";
import { 
  generateCSVDataResults, 
  generateCSVFromObject, 
  generateCSVPlayerStats, 
  generateCSVStatsMatch, 
  generateCSVData,
  generateCSVPointByPoint,
  generateCSVOdds,
  generateCSVHeadToHead,
  generateCSVStandings,
  generateCSVLineups
} from "./csvGenerator.js";
import { formatFecha } from "./fecha.js";
import {
  getFixtures,
  getMatchIdList,
  getStatsMatch,
  getMatchData,
  getStatsPlayer,
  getPointByPoint,
  getMatchOdds,
  getMatchOverUnder,
  getHeadToHead,
  getStandings,
  getMatchLineups
} from "./utils/index.js";
import { BASE_URL } from "./constants/index.js";

// Function to get current date in DD_MM_YYYY format
const getFormattedDate = () => {
  const date = new Date();
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}_${month}_${year}`;
};

// Get today's date in required format
const todayDate = getFormattedDate();

// Log functions
const logFolder = path.join(process.cwd(), 'logs');
const infoLogPath = path.join(logFolder, `info_${todayDate}.log`);
const errorLogPath = path.join(logFolder, `error_${todayDate}.log`);
const warningLogPath = path.join(logFolder, `warning_${todayDate}.log`);

// Create log folder if it doesn't exist
if (!fs.existsSync(logFolder)) {
  fs.mkdirSync(logFolder, { recursive: true });
}

const logInfo = (message) => {
  fs.appendFileSync(infoLogPath, `${new Date().toISOString()} - INFO: ${message}\n`);
};

const logError = (matchId, args, message) => {
  const argsString = Object.keys(args).map(key => `${key}=${args[key]}`).join(', ');
  fs.appendFileSync(errorLogPath, `${new Date().toISOString()} - ERROR: matchId=${matchId}, args=(${argsString}) - ${message}\n`);
};

const logWarning = (message) => {
  fs.appendFileSync(warningLogPath, `${new Date().toISOString()} - WARNING: ${message}\n`);
};

const createFolderIfNotExist = (folderPath) => {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
    logInfo(`Folder created successfully: ${folderPath}`);
  } else {
    logInfo(`Folder already exists: ${folderPath}`);
  }
};

const generateMatchCSVs = async (browser, match, competitionFolderPath, includeOptions) => {
  const matchId = match.matchId.replace('g_3_', '');
  const matchFolderPath = path.join(competitionFolderPath, match.matchId);
  const matchUrl = `${BASE_URL}/match/${matchId}/#/match-summary/match-summary`;

  createFolderIfNotExist(matchFolderPath);

  if (includeOptions.includeMatchData) {
    const matchFilePath = path.join(matchFolderPath, `MATCH_SUMMARY_${match.matchId}.csv`);
    if (!fs.existsSync(matchFilePath)) {
      const allMatchData = await getMatchData(browser, matchId);
      generateCSVFromObject(allMatchData, matchFilePath.replace('.csv', ''));
      logInfo(`CSV file created at ${matchFilePath} for URL: ${matchUrl}`);
    } else {
      logWarning(`CSV file already exists at ${matchFilePath}, skipping generation. URL: ${matchUrl}`);
    }
  }

  if (includeOptions.includeStatsPlayer) {
    const matchFilePath = path.join(matchFolderPath, `STATS_PLAYER_${match.matchId}.csv`);
    if (!fs.existsSync(matchFilePath)) {
      const allStatsPlayer = await getStatsPlayer(browser, matchId);
      generateCSVPlayerStats(allStatsPlayer, matchFilePath.replace('.csv', ''));
      logInfo(`CSV file created at ${matchFilePath} for URL: ${matchUrl}`);
    } else {
      logWarning(`CSV file already exists at ${matchFilePath}, skipping generation. URL: ${matchUrl}`);
    }
  }

  if (includeOptions.includeStatsMatch) {
    for (let i = 0; i <= 4; i++) {
      const matchFilePath = path.join(matchFolderPath, `STATS_MATCH_${match.matchId}_${i}.csv`);
      if (!fs.existsSync(matchFilePath)) {
        const allStatsMatch = await getStatsMatch(browser, matchId, i);
        generateCSVStatsMatch(allStatsMatch, matchFilePath.replace('.csv', ''));
        logInfo(`CSV file created at ${matchFilePath} for URL: ${matchUrl}`);
      } else {
        logWarning(`CSV file already exists at ${matchFilePath}, skipping generation. URL: ${matchUrl}`);
      }
    }
  }
  
  if (includeOptions.includePointByPoint) {
    for (let i = 0; i <= 4; i++) {
      const matchFilePath = path.join(matchFolderPath, `POINT_BY_POINT_${match.matchId}_${i}.csv`);
      if (!fs.existsSync(matchFilePath)) {
        const allPointByPoint = await getPointByPoint(browser, matchId, i);
        generateCSVPointByPoint(allPointByPoint, matchFilePath.replace('.csv', ''), match.matchId);
        logInfo(`CSV file created at ${matchFilePath} for URL: ${matchUrl}`);
      } else {
        logWarning(`CSV file already exists at ${matchFilePath}, skipping generation. URL: ${matchUrl}`);
      }
    }
  }

  if (includeOptions.includeOdds) {
    const matchFilePath = path.join(matchFolderPath, `ODDS_${match.matchId}.csv`);
    if (!fs.existsSync(matchFilePath)) {
      try {
        const oddsData = await getMatchOdds(browser, matchId);
        generateCSVOdds(oddsData, matchFilePath.replace('.csv', ''));
        logInfo(`CSV file created at ${matchFilePath} for URL: ${matchUrl}`);
      } catch (error) {
        logWarning(`Could not extract odds for ${match.matchId}: ${error.message}`);
      }
    } else {
      logWarning(`CSV file already exists at ${matchFilePath}, skipping generation. URL: ${matchUrl}`);
    }

    const overUnderFilePath = path.join(matchFolderPath, `OVER_UNDER_${match.matchId}.csv`);
    if (!fs.existsSync(overUnderFilePath)) {
      try {
        const overUnderData = await getMatchOverUnder(browser, matchId);
        generateCSVOdds(overUnderData, overUnderFilePath.replace('.csv', ''));
        logInfo(`CSV file created at ${overUnderFilePath} for URL: ${matchUrl}`);
      } catch (error) {
        logWarning(`Could not extract over/under for ${match.matchId}: ${error.message}`);
      }
    } else {
      logWarning(`CSV file already exists at ${overUnderFilePath}, skipping generation. URL: ${matchUrl}`);
    }
  }

  if (includeOptions.includeH2H) {
    const matchFilePath = path.join(matchFolderPath, `H2H_${match.matchId}.csv`);
    if (!fs.existsSync(matchFilePath)) {
      try {
        const h2hData = await getHeadToHead(browser, matchId);
        generateCSVHeadToHead(h2hData, matchFilePath.replace('.csv', ''));
        logInfo(`CSV file created at ${matchFilePath} for URL: ${matchUrl}`);
      } catch (error) {
        logWarning(`Could not extract H2H for ${match.matchId}: ${error.message}`);
      }
    } else {
      logWarning(`CSV file already exists at ${matchFilePath}, skipping generation. URL: ${matchUrl}`);
    }
  }

  if (includeOptions.includeLineups) {
    const matchFilePath = path.join(matchFolderPath, `LINEUPS_${match.matchId}.csv`);
    if (!fs.existsSync(matchFilePath)) {
      try {
        const lineupData = await getMatchLineups(browser, matchId);
        generateCSVLineups(lineupData, matchFilePath.replace('.csv', ''));
        logInfo(`CSV file created at ${matchFilePath} for URL: ${matchUrl}`);
      } catch (error) {
        logWarning(`Could not extract lineups for ${match.matchId}: ${error.message}`);
      }
    } else {
      logWarning(`CSV file already exists at ${matchFilePath}, skipping generation. URL: ${matchUrl}`);
    }
  }
};

(async () => {
  const args = {
    country: null,
    ids: null,
    league: null,
    competition: null, // <-- Added to capture the competition name
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

  // Get command line arguments and extract values
  process.argv.slice(2).forEach(arg => {
    if (arg.startsWith("country=")) args.country = arg.split("country=")[1];
    if (arg.startsWith("ids=")) args.ids = arg.split("ids=")[1];
    if (arg.startsWith("league=")) args.league = arg.split("league=")[1];
    if (arg.startsWith("competition=")) args.competition = arg.split("competition=")[1]; // <-- Capturing the competition name
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

  // If includeAll is set, enable all data extraction options
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

  // Log all values to verify they are being captured correctly
  logInfo(`Country: ${args.country}`);
  logInfo(`League: ${args.league}`);
  logInfo(`Competition: ${args.competition}`); // <-- Logging the competition name
  logInfo(`Action: ${args.action}`);
  logInfo(`Ids: ${args.ids}`);
  logInfo(`Include Match Data: ${args.includeMatchData}`);
  logInfo(`Include Stats Player: ${args.includeStatsPlayer}`);
  logInfo(`Include Stats Match: ${args.includeStatsMatch}`);
  logInfo(`Include Point By Point: ${args.includePointByPoint}`);
  logInfo(`Include Odds: ${args.includeOdds}`);
  logInfo(`Include H2H: ${args.includeH2H}`);
  logInfo(`Include Standings: ${args.includeStandings}`);
  logInfo(`Include Lineups: ${args.includeLineups}`);
  logInfo(`Include All: ${args.includeAll}`);

  // Base folder path is always './src/csv'
  const baseFolderPath = path.join(process.cwd(), 'src', 'csv');
  const folderName = args.competition ? args.competition : `${args.country}_${args.league}`;
  const competitionFolderPath = path.join(baseFolderPath, 'results', folderName);
  const resultsFolderPath = path.join(baseFolderPath, 'results');
  const fixturesFolderPath = path.join(baseFolderPath, 'fixtures');
  createFolderIfNotExist(competitionFolderPath);
  createFolderIfNotExist(resultsFolderPath);
  createFolderIfNotExist(fixturesFolderPath);

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    // --no-sandbox is required when running Puppeteer inside a Docker container
    // (Chrome cannot use sandboxing without root privileges in that environment)
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const includeOptions = { 
      includeMatchData: args.includeMatchData, 
      includeStatsPlayer: args.includeStatsPlayer, 
      includeStatsMatch: args.includeStatsMatch, 
      includePointByPoint: args.includePointByPoint,
      includeOdds: args.includeOdds,
      includeH2H: args.includeH2H,
      includeLineups: args.includeLineups
    };

    if (args.ids !== null) {
      const idList = args.ids.split(',');
      for (const matchId of idList) {
        logInfo(`Processing match by ID: ${matchId}`);
        try {
          const match = { matchId: `${matchId}` }; // Modify as needed to match your match object structure
          await generateMatchCSVs(browser, match, competitionFolderPath, includeOptions);
        } catch (error) {
          logError(matchId, args, `Error processing match ${matchId}: ${error.message}`);
        }
      }
    } else if (args.action === "results") {
      logInfo("Generating CSV file...");
      // The first step is to get the results in a results.csv file
      const allMatchIdLists = await getMatchIdList(browser, args.country, args.league);
      logInfo(`Total matches found: ${allMatchIdLists.eventDataList.length}`);
      const fechaActual = new Date();
      const formattedFecha = formatFecha(fechaActual);
      const nombreArchivo = path.join(competitionFolderPath, `RESULTS_${formattedFecha}_${args.country}_${args.league}.csv`);
      generateCSVDataResults(allMatchIdLists.eventDataList, nombreArchivo.replace('.csv', ''));
      logInfo("Results CSV file generated.");
      for (const match of allMatchIdLists.eventDataList) {
        const matchId = match.matchId.replace('g_3_', '');
        logInfo(`Processing match: ${match.matchId} URL: https://example.com/match/${matchId}`);
        try {
          await generateMatchCSVs(browser, match, competitionFolderPath, includeOptions);
        } catch (error) {
          logError(matchId, args, `Error processing match ${match.matchId} URL: https://example.com/match/${matchId}: ${error.message}`);
        }
      }
    } else if (args.action === "fixtures") {
      const allFixtures = await getFixtures(browser, args.country, args.league);
      const matchFilePath = path.join(fixturesFolderPath, `FIXTURES_${args.country}_${args.league}.csv`);
      generateCSVData(allFixtures, matchFilePath.replace('.csv', ''));
      logInfo("Fixtures CSV file generated.");
    } else if (args.action === "standings") {
      const standingsData = await getStandings(browser, args.country, args.league);
      const standingsFilePath = path.join(competitionFolderPath, `STANDINGS_${args.country}_${args.league}.csv`);
      generateCSVStandings(standingsData, standingsFilePath.replace('.csv', ''));
      logInfo("Standings CSV file generated.");
    }

    // Extract standings if included (for results or ids actions)
    if (args.includeStandings && args.country && args.league && args.action !== "standings") {
      try {
        const standingsData = await getStandings(browser, args.country, args.league);
        const standingsFilePath = path.join(competitionFolderPath, `STANDINGS_${args.country}_${args.league}.csv`);
        if (!fs.existsSync(`${standingsFilePath.replace('.csv', '')}.csv`)) {
          generateCSVStandings(standingsData, standingsFilePath.replace('.csv', ''));
          logInfo("Standings CSV file generated.");
        }
      } catch (error) {
        logWarning(`Could not extract standings: ${error.message}`);
      }
    }
  } catch (error) {
    logError('N/A', args, `Error processing the action: ${error.message}`);
  } finally {
    await browser.close();
  }
})();
