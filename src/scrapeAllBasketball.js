import fs from 'fs';
import path from 'path';
import puppeteer from "puppeteer";
import { getAllBasketballResults, getMatchData, getStatsPlayer, getStatsMatch, getPointByPoint, getMatchOdds, getMatchOverUnder, getHeadToHead, getMatchLineups } from "./utils/index.js";
import { generateCSVDataResults, generateCSVFromObject, generateCSVPlayerStats, generateCSVStatsMatch, generateCSVPointByPoint, generateCSVOdds, generateCSVHeadToHead, generateCSVLineups } from "./csvGenerator.js";
import { formatFecha } from "./fecha.js";
import { BASE_URL } from "./constants/index.js";

// Function to get current date in DD_MM_YYYY format
const getFormattedDate = () => {
  const date = new Date();
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}_${month}_${year}`;
};

const todayDate = getFormattedDate();

// Log functions
const logFolder = path.join(process.cwd(), 'logs');
const infoLogPath = path.join(logFolder, `info_${todayDate}.log`);
const errorLogPath = path.join(logFolder, `error_${todayDate}.log`);

if (!fs.existsSync(logFolder)) {
  fs.mkdirSync(logFolder, { recursive: true });
}

const logInfo = (message) => {
  fs.appendFileSync(infoLogPath, `${new Date().toISOString()} - INFO: ${message}\n`);
};

const logError = (message) => {
  fs.appendFileSync(errorLogPath, `${new Date().toISOString()} - ERROR: ${message}\n`);
};

(async () => {
  const args = {
    detailed: false,
  };

  process.argv.slice(2).forEach(arg => {
    if (arg === "detailed=true" || arg === "--detailed") args.detailed = true;
  });

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    logInfo("Scraping all basketball results from flashscore.com/basketball/ ...");
    const results = await getAllBasketballResults(browser);
    logInfo(`Total matches found: ${results.data.length}`);

    // Print results to console
    console.log(`Sport: ${results.sportName}`);
    console.log(`Total matches found: ${results.data.length}`);
    results.data.forEach((match) => {
      console.log(
        `[${match.country} - ${match.league}] ${match.eventTime} | ${match.homeTeam} ${match.homeScore} - ${match.awayScore} ${match.awayTeam}` +
        (match.round ? ` | Round: ${match.round}` : '') +
        (match.matchStatus ? ` | Status: ${match.matchStatus}` : '') +
        (match.homeScore1 ? ` (${match.homeScore1},${match.homeScore2},${match.homeScore3},${match.homeScore4}${match.homeScore5 ? ',' + match.homeScore5 : ''})` : '') +
        (match.awayScore1 ? ` (${match.awayScore1},${match.awayScore2},${match.awayScore3},${match.awayScore4}${match.awayScore5 ? ',' + match.awayScore5 : ''})` : '')
      );
    });

    // Save results to CSV
    const baseFolderPath = path.join(process.cwd(), 'src', 'csv');
    const resultsFolderPath = path.join(baseFolderPath, 'results');
    if (!fs.existsSync(resultsFolderPath)) {
      fs.mkdirSync(resultsFolderPath, { recursive: true });
    }

    const fechaActual = new Date();
    const formattedFecha = formatFecha(fechaActual);
    const nombreArchivo = path.join(resultsFolderPath, `ALL_BASKETBALL_RESULTS_${formattedFecha}`);
    generateCSVDataResults(results.data, nombreArchivo);
    logInfo(`CSV file generated: ${nombreArchivo}.csv`);
    console.log(`CSV file generated: ${nombreArchivo}.csv`);

    // If --detailed flag is set, extract detailed data for each match
    if (args.detailed) {
      console.log('\nExtracting detailed data for each match...');
      const detailedFolderPath = path.join(resultsFolderPath, `ALL_BASKETBALL_DETAILED_${formattedFecha}`);
      if (!fs.existsSync(detailedFolderPath)) {
        fs.mkdirSync(detailedFolderPath, { recursive: true });
      }

      for (const match of results.data) {
        if (!match.matchId) continue;
        const matchId = match.matchId;
        const matchFolderPath = path.join(detailedFolderPath, matchId);
        if (!fs.existsSync(matchFolderPath)) {
          fs.mkdirSync(matchFolderPath, { recursive: true });
        }

        console.log(`  Processing match: ${matchId} (${match.homeTeam} vs ${match.awayTeam})`);

        try {
          const matchData = await getMatchData(browser, matchId);
          generateCSVFromObject(matchData, path.join(matchFolderPath, `MATCH_SUMMARY_${matchId}`));
        } catch (error) {
          logError(`Error getting match data for ${matchId}: ${error.message}`);
        }

        try {
          const statsPlayer = await getStatsPlayer(browser, matchId);
          if (statsPlayer && statsPlayer.length > 0) {
            generateCSVPlayerStats(statsPlayer, path.join(matchFolderPath, `STATS_PLAYER_${matchId}`));
          }
        } catch (error) {
          logError(`Error getting player stats for ${matchId}: ${error.message}`);
        }

        for (let i = 0; i <= 4; i++) {
          try {
            const statsMatch = await getStatsMatch(browser, matchId, i);
            if (statsMatch) {
              generateCSVStatsMatch(statsMatch, path.join(matchFolderPath, `STATS_MATCH_${matchId}_${i}`));
            }
          } catch (error) {
            // Expected for periods that don't exist
          }
        }

        for (let i = 0; i <= 4; i++) {
          try {
            const pointByPoint = await getPointByPoint(browser, matchId, i);
            if (pointByPoint && pointByPoint.length > 0) {
              generateCSVPointByPoint(pointByPoint, path.join(matchFolderPath, `POINT_BY_POINT_${matchId}_${i}`), matchId);
            }
          } catch (error) {
            // Expected for periods that don't exist
          }
        }

        try {
          const oddsData = await getMatchOdds(browser, matchId);
          if (oddsData && oddsData.length > 0) {
            generateCSVOdds(oddsData, path.join(matchFolderPath, `ODDS_${matchId}`));
          }
        } catch (error) {
          logError(`Error getting odds for ${matchId}: ${error.message}`);
        }

        try {
          const overUnderData = await getMatchOverUnder(browser, matchId);
          if (overUnderData && overUnderData.length > 0) {
            generateCSVOdds(overUnderData, path.join(matchFolderPath, `OVER_UNDER_${matchId}`));
          }
        } catch (error) {
          logError(`Error getting over/under for ${matchId}: ${error.message}`);
        }

        try {
          const h2hData = await getHeadToHead(browser, matchId);
          if (h2hData) {
            generateCSVHeadToHead(h2hData, path.join(matchFolderPath, `H2H_${matchId}`));
          }
        } catch (error) {
          logError(`Error getting H2H for ${matchId}: ${error.message}`);
        }

        try {
          const lineupData = await getMatchLineups(browser, matchId);
          if (lineupData && (lineupData.home?.length || lineupData.away?.length)) {
            generateCSVLineups(lineupData, path.join(matchFolderPath, `LINEUPS_${matchId}`));
          }
        } catch (error) {
          logError(`Error getting lineups for ${matchId}: ${error.message}`);
        }
      }

      console.log('Detailed data extraction complete.');
    }
  } catch (error) {
    console.error('Error scraping basketball results:', error);
    logError(`Error scraping basketball results: ${error.message}`);
  } finally {
    await browser.close();
  }
})();
