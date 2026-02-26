import fs from 'fs';
import path from 'path';
import puppeteer from "puppeteer";
import { getCountriesAndLeagues } from "./utils/index.js";
import { generateCSVCountriesAndLeagues } from "./csvGenerator.js";
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
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    logInfo("Scraping countries and leagues from flashscore.com/basketball/ ...");
    const countriesAndLeagues = await getCountriesAndLeagues(browser);
    logInfo(`Total entries found: ${countriesAndLeagues.length}`);

    // Print results to console
    console.log(`Total countries/leagues found: ${countriesAndLeagues.length}`);
    countriesAndLeagues.forEach((entry) => {
      console.log(
        `[${entry.country}] ${entry.league} -> ${entry.leagueHref || entry.countryHref}`
      );
    });

    // Save results to CSV
    const baseFolderPath = path.join(process.cwd(), 'src', 'csv');
    if (!fs.existsSync(baseFolderPath)) {
      fs.mkdirSync(baseFolderPath, { recursive: true });
    }

    const fechaActual = new Date();
    const formattedFecha = formatFecha(fechaActual);
    const nombreArchivo = path.join(baseFolderPath, `COUNTRIES_LEAGUES_${formattedFecha}`);
    generateCSVCountriesAndLeagues(countriesAndLeagues, nombreArchivo);
    logInfo(`CSV file generated: ${nombreArchivo}.csv`);
    console.log(`CSV file generated: ${nombreArchivo}.csv`);
  } catch (error) {
    console.error('Error scraping countries and leagues:', error);
    logError(`Error scraping countries and leagues: ${error.message}`);
  } finally {
    await browser.close();
  }
})();
