import fs from 'fs';
import path from 'path';
import puppeteer from "puppeteer";
import { getAllBasketballResults } from "./utils/index.js";
import { generateCSVDataResults } from "./csvGenerator.js";
import { formatFecha } from "./fecha.js";

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
  const browser = await puppeteer.launch({
    headless: "new",
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
  } catch (error) {
    console.error('Error scraping basketball results:', error);
    logError(`Error scraping basketball results: ${error.message}`);
  } finally {
    await browser.close();
  }
})();
