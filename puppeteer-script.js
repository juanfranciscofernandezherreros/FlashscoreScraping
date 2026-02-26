import puppeteer from "puppeteer"
import { getAllBasketballResults } from "./src/utils/index.js";

const browser = await puppeteer.launch({
    //headless: "new", // Opting into the new headless mode instead of true
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
});

try {
    const results = await getAllBasketballResults(browser);
    console.log(`Sport: ${results.sportName}`);
    console.log(`Total matches found: ${results.data.length}`);
    results.data.forEach((match) => {
      console.log(
        `[${match.country} - ${match.league}] ${match.eventTime} | ${match.homeTeam} ${match.homeScore} - ${match.awayScore} ${match.awayTeam}`
      );
    });
    console.log('Puppeteer script executed successfully.');
} catch (error) {
    console.error('Error running Puppeteer script:', error);
} finally {
    // Close the browser
    await browser.close();
}