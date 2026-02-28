import fs from "fs";
import path from "path";

import { BASE_URL, BASKETBALL_URL } from "../constants/index.js";

export const getMatchIdList = async (browser, country, league) => {
  const page = await browser.newPage();
  const url = `${BASKETBALL_URL}/${country}/${league}/results/`;
  console.log(`Opening URL: ${url}`);
  await page.goto(url);

  try {
    await autoScroll(page);
  } catch (error) {
    console.error("Error while scrolling:", error);
  }

  const eventDataList = await extractEventData(page);
  await page.close();
  return { eventDataList };
};

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      const scrollInterval = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(scrollInterval);
          resolve();
        }
      }, 100);
    });
  });
}

async function extractEventData(page) {
  return await page.evaluate(() => {
    const eventDataList = [];
    const eventElements = document.querySelectorAll('.event__match.event__match--static.event__match--twoLine');
    eventElements.forEach((element) => {
        const matchId = element?.id?.replace('g_1_', '');
        const matchHref = element.querySelector('a.eventRowLink')?.getAttribute('href') || '';
        const matchLink = matchHref
          ? (matchHref.startsWith('http') ? matchHref : `${window.location.origin}${matchHref}`)
          : '';
        const eventTime = element.querySelector('.event__time').textContent.trim();
        const homeTeam = element.querySelector('.event__participant.event__participant--home')?.textContent.trim() || null;
        const awayTeam = element.querySelector('.event__participant.event__participant--away')?.textContent.trim() || null;
        const homeScore = element.querySelector('.event__score.event__score--home')?.textContent.trim() || null;
        const awayScore = element.querySelector('.event__score.event__score--away')?.textContent.trim() || null;        
        const homeScore1Element = element.querySelector('.event__part.event__part--home.event__part--1');
        const homeScore2Element = element.querySelector('.event__part.event__part--home.event__part--2');
        const homeScore3Element = element.querySelector('.event__part.event__part--home.event__part--3');
        const homeScore4Element = element.querySelector('.event__part.event__part--home.event__part--4');
        const homeScore5Element = element.querySelector('.event__part.event__part--home.event__part--5');
        const awayScore1Element = element.querySelector('.event__part.event__part--away.event__part--1');
        const awayScore2Element = element.querySelector('.event__part.event__part--away.event__part--2');
        const awayScore3Element = element.querySelector('.event__part.event__part--away.event__part--3');
        const awayScore4Element = element.querySelector('.event__part.event__part--away.event__part--4');
        const awayScore5Element = element.querySelector('.event__part.event__part--away.event__part--5');
        const homeScore1 = homeScore1Element ? homeScore1Element.textContent.trim() : null;
        const homeScore2 = homeScore2Element ? homeScore2Element.textContent.trim() : null;
        const homeScore3 = homeScore3Element ? homeScore3Element.textContent.trim() : null;
        const homeScore4 = homeScore4Element ? homeScore4Element.textContent.trim() : null;
        const homeScore5 = homeScore5Element ? homeScore5Element.textContent.trim() : null;
        const awayScore1 = awayScore1Element ? awayScore1Element.textContent.trim() : null;
        const awayScore2 = awayScore2Element ? awayScore2Element.textContent.trim() : null;
        const awayScore3 = awayScore3Element ? awayScore3Element.textContent.trim() : null;
        const awayScore4 = awayScore4Element ? awayScore4Element.textContent.trim() : null;
        const awayScore5 = awayScore5Element ? awayScore5Element.textContent.trim() : null;
      eventDataList.push({ matchId, eventTime, homeTeam, awayTeam, homeScore, awayScore, homeScore1, homeScore2, homeScore3, homeScore4, homeScore5, awayScore1, awayScore2, awayScore3, awayScore4, awayScore5, matchLink });
    });

    return eventDataList;
  });
}


export const getFixtures = async (browser, country, league) => {
  const page = await browser.newPage();
  const url = `${BASKETBALL_URL}/${country}/${league}/fixtures/`;
  console.log(`Opening URL: ${url}`);
  await page.goto(url);  
  while (true) {
    try {
      await page.evaluate(async () => {
        await new Promise(resolve => setTimeout(resolve, 1500));
        const element = document.querySelector('a.event__more.event__more--static');
        element.scrollIntoView();
        element.click();
      });
    } catch (error) {
      break;
    }
  }

  const matchIdList = await page.evaluate(() => {
    return Array.from(document.querySelectorAll(".event__match--static"))
      .map(element => element?.id?.replace("g_1_", ""));
  });

  // Use Puppeteer to extract the event__time values
  const eventTimes = await page.evaluate(() => {
    const eventTimeElements = Array.from(document.querySelectorAll('.event__time'));
    return eventTimeElements.map(element => element.textContent);
  });

  // Use Puppeteer to extract the event__time values
  const eventHome = await page.evaluate(() => {
    const eventTimeElements = Array.from(document.querySelectorAll('.event__participant--home'));
    return eventTimeElements.map(element => element.textContent);
  });

  // Use Puppeteer to extract the event__time values
  const eventAway = await page.evaluate(() => {
    const eventTimeElements = Array.from(document.querySelectorAll('.event__participant--away'));
    return eventTimeElements.map(element => element.textContent);
  });

  await page.close();

  // Combina todas las listas en un solo array
  const combinedData = [];
  for (let i = 0; i < matchIdList.length; i++) {
    combinedData.push({
      matchId: matchIdList[i],
      eventTime: eventTimes[i],
      homeTeam: eventHome[i],
      awayTeam: eventAway[i],
    });
  }
  return combinedData;
};

export const getMatchData = async (browser, matchId) => {
  const page = await browser.newPage();  
  const url = `${BASE_URL}/match/${matchId}/#/match-summary/match-summary`;
  console.log(`Opening URL: ${url}`);
  await page.goto(url);
  await new Promise(resolve => setTimeout(resolve, 1500));
  const data = await page.evaluate(async _ => ({
    date: document.querySelector(".duelParticipant__startTime")?.outerText,
    home: {
      name: document.querySelector(".duelParticipant__home .participant__participantName.participant__overflow")?.outerText,
      image: document.querySelector(".duelParticipant__home .participant__image")?.src
    },
    away: {
      name: document.querySelector(".duelParticipant__away .participant__participantName.participant__overflow")?.outerText,
      image: document.querySelector(".duelParticipant__away .participant__image")?.src
    },
    result: {
      home: Array.from(document.querySelectorAll(".detailScore__wrapper span:not(.detailScore__divider)"))?.[0]?.outerText,
      away: Array.from(document.querySelectorAll(".detailScore__wrapper span:not(.detailScore__divider)"))?.[1]?.outerText,
    },
    status: document.querySelector(".fixedHeaderDuel__detailStatus")?.textContent?.trim() || '',
    venue: document.querySelector(".mi__data")?.textContent?.trim() || '',
    referee: (() => {
      const infoRows = document.querySelectorAll(".mi__item");
      for (const row of infoRows) {
        const label = row.querySelector(".mi__item__name");
        if (label && label.textContent.trim().toLowerCase().includes('referee')) {
          return row.querySelector(".mi__item__val")?.textContent?.trim() || '';
        }
      }
      return '';
    })(),
    attendance: (() => {
      const infoRows = document.querySelectorAll(".mi__item");
      for (const row of infoRows) {
        const label = row.querySelector(".mi__item__name");
        if (label && label.textContent.trim().toLowerCase().includes('attendance')) {
          return row.querySelector(".mi__item__val")?.textContent?.trim() || '';
        }
      }
      return '';
    })(),
    round: document.querySelector(".tournamentHeader__country")?.textContent?.trim()?.split(' - ').pop()?.trim() || '',
    totalLocal: Array.from(document.querySelectorAll(".smh__home.smh__part"))?.[0]?.outerText,
    firstLocal: Array.from(document.querySelectorAll(".smh__home.smh__part"))?.[1]?.outerText,
    secondLocal: Array.from(document.querySelectorAll(".smh__home.smh__part"))?.[2]?.outerText,
    thirstLocal: Array.from(document.querySelectorAll(".smh__home.smh__part"))?.[3]?.outerText,
    fourthLocal: Array.from(document.querySelectorAll(".smh__home.smh__part"))?.[4]?.outerText,
    extraLocal: Array.from(document.querySelectorAll(".smh__home.smh__part"))?.[5]?.outerText,
    totalAway: Array.from(document.querySelectorAll(".smh__away.smh__part"))?.[0]?.outerText,
    firstAway: Array.from(document.querySelectorAll(".smh__away.smh__part"))?.[1]?.outerText,
    secondAway: Array.from(document.querySelectorAll(".smh__away.smh__part"))?.[2]?.outerText,
    thirstAway: Array.from(document.querySelectorAll(".smh__away.smh__part"))?.[3]?.outerText,
    fourthAway: Array.from(document.querySelectorAll(".smh__away.smh__part"))?.[4]?.outerText,
    extraAway: Array.from(document.querySelectorAll(".smh__away.smh__part"))?.[5]?.outerText
  }));
  await page.close();
  return data;
}

export const getStatsPlayer = async (browser, matchId) => {
  const page = await browser.newPage();  
  const url = `${BASE_URL}/match/${matchId}/#/match-summary/player-statistics/0`;
  console.log(`Opening URL: ${url}`);
  await page.goto(url);
  await new Promise((resolve) => setTimeout(resolve, 1500));
  const playerData = await page.evaluate(() => {
    const playerRows = document.querySelectorAll("div.playerStatsTable__row");
    const playerData = [];
    const headerCells = document.querySelectorAll(".playerStatsTable__headerCell");
    const statHeaders = [];
    statHeaders.push("TEAM");
    headerCells.forEach((cell) => {      
      statHeaders.push(cell.textContent.trim());
    });

    playerRows.forEach((row) => {
      const playerName = row.querySelector("a[href*='/player/']").textContent;
      const playerStats = Array.from(row.querySelectorAll("div.playerStatsTable__cell")).map((element) =>
        element.textContent.trim()
      );
      // Create an object with all the player statistics
      const playerStatsObject = {};

      // Iterate through all the statistics and add them to the object
      statHeaders.forEach((header, index) => {
        playerStatsObject[header] = playerStats[index];
      });
      playerData.push({
        name: playerName,
        stats: playerStatsObject,
      });
    });
    return playerData; // Return the playerData object
  });
  return playerData;
};

export const getStatsMatchButtonXPath = (playerIndex) =>
  `//*[@id="detail"]/div[4]/div[1]/div/a[${playerIndex + 1}]/button`;

export const getStatsMatch = async (browser, matchId, playerIndex) => {
  const page = await browser.newPage();    
  const url = `${BASE_URL}/match/${matchId}/#/match-summary/match-statistics`;
  console.log(`Opening URL: ${url}`);
  
  await page.goto(url, { waitUntil: 'networkidle2' });
  const periodButtonXPath = getStatsMatchButtonXPath(playerIndex);
  await page.waitForFunction((xpath) => {
    const node = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    return !!node;
  }, { timeout: 5000 }, periodButtonXPath);
  const clicked = await page.evaluate((xpath) => {
    const node = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    if (!node) return false;
    node.click();
    return true;
  }, periodButtonXPath);
  if (!clicked) {
    throw new Error(`Could not click stats match period button for index ${playerIndex}`);
  }
  await page.waitForSelector('._value_1jbkc_4._homeValue_1jbkc_9', { timeout: 5000 });
  await page.waitForSelector('._value_1jbkc_4._awayValue_1jbkc_13', { timeout: 5000 });
  await page.waitForSelector('._category_1ague_4', { timeout: 5000 });

  const matchData = await page.evaluate(() => {
    const homeRows = document.querySelectorAll('._value_1jbkc_4._homeValue_1jbkc_9');
    const awayRows = document.querySelectorAll('._value_1jbkc_4._awayValue_1jbkc_13');
    const categoryElements = document.querySelectorAll('._category_1ague_4');

    const csvRows = [];

    homeRows.forEach((homeRow, index) => {
      const homeScore = homeRow.textContent.trim();
      const awayScore = awayRows[index].textContent.trim();
      const category = categoryElements[index].textContent.trim();
      const csvRow = `${homeScore},${category},${awayScore}`;
      csvRows.push(csvRow);
    });

    return csvRows.join('\n');
  });

  await page.close();
  return matchData;
};


export const getDateMatch = async (browser, matchId) => {
  const match = matchId.split('_')[2];
  const page = await browser.newPage();
  const url = `${BASE_URL}/match/${match}/#/match-summary`;
  console.log(`Opening URL: ${url}`);
  await page.goto(url);
  
  // Espera a que los elementos estén presentes en el DOM y sean visibles
  await page.waitForSelector('.duelParticipant__startTime');
  await page.waitForSelector('.duelParticipant__home .participant__participantName a');

  const data = await page.evaluate(() => {
    const rows = document.querySelectorAll('.duelParticipant__startTime');
    const dates = [];

    rows.forEach(row => {
      const dateText = row.textContent.trim();
      dates.push(dateText);
    });

    const teamInfo = document.querySelector('.duelParticipant__home');
    const teamLinkLocal = teamInfo.querySelector('.participant__participantName a').getAttribute('href');
    const teamNameLocal = teamInfo.querySelector('.participant__participantName a').innerText.trim();

    const teamAway = document.querySelector('.duelParticipant__away');
    const teamLinkAway = teamAway.querySelector('.participant__participantName a').getAttribute('href');
    const teamNameAway = teamAway.querySelector('.participant__participantName a').innerText.trim();

    return { dates, teamNameLocal, teamLinkLocal, teamNameAway, teamLinkAway };
});

const matchHistoryRows = data.dates; 
const teamNameLocal = data.teamNameLocal;
const teamLinkLocal = data.teamLinkLocal;
const teamNameAway = data.teamNameAway;
const teamLinkAway = data.teamLinkAway;
  return { matchHistoryRows, teamNameLocal, teamNameAway,teamLinkLocal,teamLinkAway };
};

export const getPointByPoint = async (browser, matchId,playerIndex) => {
  const page = await browser.newPage();  
  const url = `${BASE_URL}/match/${matchId}/#/match-summary/point-by-point/${playerIndex}`;
  console.log(`Opening URL: ${url}`);
  await page.goto(url);
  await new Promise(resolve => setTimeout(resolve, 1500));
  // Use page.evaluate to interact with the page and extract data.
   const matchHistoryRows = await page.evaluate(() => {
    const rows = document.querySelectorAll('.matchHistoryRow');
    const matchHistory = [];

    rows.forEach((row) => {
      const time = row.querySelector('.matchHistoryRow__time')?.textContent.trim() || '';
      const score = row.querySelector('.matchHistoryRow__scoreBox')?.textContent.trim() || '';
      const homeIncident = row.querySelector('.matchHistoryRow__homeIncident')?.textContent.trim() || '';
      const awayIncident = row.querySelector('.matchHistoryRow__awayIncident')?.textContent.trim() || '';
      matchHistory.push({ time, score, homeIncident, awayIncident });
    });

    return matchHistory;
  });
  return matchHistoryRows;
};

export const getAllBasketballResults = async (browser) => {
  const page = await browser.newPage();
  const url = `${BASKETBALL_URL}/`;
  console.log(`Opening URL: ${url}`);
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

  try {
    await autoScroll(page);
  } catch (error) {
    console.error("Error while scrolling:", error);
  }

  const results = await page.evaluate(() => {
    const data = [];
    let currentCountry = '';
    let currentLeague = '';
    let currentRound = '';

    const sportName = document.querySelector('.heading__title')?.textContent.trim() || 'Basketball';

    const elements = document.querySelectorAll('.event__header, .event__round, .event__match');

    elements.forEach((el) => {
      if (el.classList.contains('event__header')) {
        const countryEl = el.querySelector('.event__title--type');
        const leagueEl = el.querySelector('.event__title--name');
        currentCountry = countryEl ? countryEl.textContent.trim() : '';
        currentLeague = leagueEl ? leagueEl.textContent.trim() : '';
        currentRound = '';
      } else if (el.classList.contains('event__round')) {
        currentRound = el.textContent.trim();
      } else if (el.classList.contains('event__match')) {
        const matchId = el.id ? el.id.replace('g_1_', '') : '';
        const matchHref = el.querySelector('a.eventRowLink')?.getAttribute('href') || '';
        const matchLink = matchHref
          ? (matchHref.startsWith('http') ? matchHref : `${window.location.origin}${matchHref}`)
          : '';
        const eventTime = el.querySelector('.event__time')?.textContent.trim() || '';
        const homeTeam = el.querySelector('.event__participant--home')?.textContent.trim() || '';
        const awayTeam = el.querySelector('.event__participant--away')?.textContent.trim() || '';
        const homeScore = el.querySelector('.event__score--home')?.textContent.trim() || '';
        const awayScore = el.querySelector('.event__score--away')?.textContent.trim() || '';
        const matchStatus = el.querySelector('.event__stage--block, .event__stage')?.textContent.trim() || '';
        const result = (homeScore || awayScore) ? `${homeScore}-${awayScore}` : '';

        const homeScoreParts = [];
        const awayScoreParts = [];
        for (let i = 1; i <= 5; i++) {
          const hp = el.querySelector(`.event__part--home.event__part--${i}`);
          const ap = el.querySelector(`.event__part--away.event__part--${i}`);
          homeScoreParts.push(hp ? hp.textContent.trim() : '');
          awayScoreParts.push(ap ? ap.textContent.trim() : '');
        }

        data.push({
          country: currentCountry,
          league: currentLeague,
          competition: currentLeague,
          round: currentRound,
          matchId,
          eventTime,
          state: matchStatus,
          matchStatus,
          result,
          homeTeam,
          awayTeam,
          homeScore,
          awayScore,
          homeScore1: homeScoreParts[0],
          homeScore2: homeScoreParts[1],
          homeScore3: homeScoreParts[2],
          homeScore4: homeScoreParts[3],
          homeScore5: homeScoreParts[4],
          awayScore1: awayScoreParts[0],
          awayScore2: awayScoreParts[1],
          awayScore3: awayScoreParts[2],
          awayScore4: awayScoreParts[3],
          awayScore5: awayScoreParts[4],
          matchLink,
        });
      }
    });

    return { sportName, data };
  });

  await page.close();
  return results;
};

export const getMatchOdds = async (browser, matchId) => {
  const page = await browser.newPage();
  const url = `${BASE_URL}/match/${matchId}/#/odds-comparison/1x2-odds/full-time`;
  console.log(`Opening URL: ${url}`);
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(resolve => setTimeout(resolve, 2000));

  const oddsData = await page.evaluate(() => {
    const rows = document.querySelectorAll('.ui-table__row');
    const odds = [];

    rows.forEach((row) => {
      const bookmaker = row.querySelector('.oddsCell__bookmaker')?.textContent?.trim() ||
                        row.querySelector('.prematchOdds__bookmaker')?.textContent?.trim() || '';
      const cells = row.querySelectorAll('.oddsCell__odd, .prematchOdds__odd');
      const oddsValues = Array.from(cells).map(c => c.textContent.trim());

      if (bookmaker || oddsValues.length > 0) {
        odds.push({
          bookmaker,
          odd1: oddsValues[0] || '',
          oddX: oddsValues[1] || '',
          odd2: oddsValues[2] || '',
        });
      }
    });

    return odds;
  });

  await page.close();
  return oddsData;
};

export const getMatchOverUnder = async (browser, matchId) => {
  const page = await browser.newPage();
  const url = `${BASE_URL}/match/${matchId}/#/odds-comparison/over-under/full-time`;
  console.log(`Opening URL: ${url}`);
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(resolve => setTimeout(resolve, 2000));

  const overUnderData = await page.evaluate(() => {
    const rows = document.querySelectorAll('.ui-table__row');
    const data = [];

    rows.forEach((row) => {
      const bookmaker = row.querySelector('.oddsCell__bookmaker')?.textContent?.trim() ||
                        row.querySelector('.prematchOdds__bookmaker')?.textContent?.trim() || '';
      const cells = row.querySelectorAll('.oddsCell__odd, .prematchOdds__odd');
      const oddsValues = Array.from(cells).map(c => c.textContent.trim());

      if (bookmaker || oddsValues.length > 0) {
        data.push({
          bookmaker,
          over: oddsValues[0] || '',
          under: oddsValues[1] || '',
        });
      }
    });

    return data;
  });

  await page.close();
  return overUnderData;
};

export const getHeadToHead = async (browser, matchId) => {
  const page = await browser.newPage();
  const url = `${BASE_URL}/match/${matchId}/#/h2h/overall`;
  console.log(`Opening URL: ${url}`);
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(resolve => setTimeout(resolve, 2000));

  const h2hData = await page.evaluate(() => {
    const sections = document.querySelectorAll('.h2h__section');
    const result = { homeLastMatches: [], awayLastMatches: [], directMatches: [] };

    sections.forEach((section, sectionIndex) => {
      const rows = section.querySelectorAll('.h2h__row');
      rows.forEach((row) => {
        const date = row.querySelector('.h2h__date')?.textContent?.trim() || '';
        const event = row.querySelector('.h2h__event')?.textContent?.trim() || '';
        const homeTeam = row.querySelector('.h2h__homeParticipant')?.textContent?.trim() || '';
        const awayTeam = row.querySelector('.h2h__awayParticipant')?.textContent?.trim() || '';
        const result_text = row.querySelector('.h2h__result')?.textContent?.trim() || '';

        const matchData = { date, event, homeTeam, awayTeam, result: result_text };

        if (sectionIndex === 0) {
          result.homeLastMatches.push(matchData);
        } else if (sectionIndex === 1) {
          result.awayLastMatches.push(matchData);
        } else if (sectionIndex === 2) {
          result.directMatches.push(matchData);
        }
      });
    });

    return result;
  });

  await page.close();
  return h2hData;
};

export const getStandings = async (browser, country, league) => {
  const page = await browser.newPage();
  const url = `${BASKETBALL_URL}/${country}/${league}/standings/`;
  console.log(`Opening URL: ${url}`);
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(resolve => setTimeout(resolve, 2000));

  const standingsData = await page.evaluate(() => {
    const headerCells = document.querySelectorAll('.ui-table__header .table__headerCell');
    const headers = Array.from(headerCells).map(h => h.textContent.trim()).filter(h => h);

    const rows = document.querySelectorAll('.ui-table__body .ui-table__row');
    const standings = [];

    rows.forEach((row) => {
      const rank = row.querySelector('.tableCellRank')?.textContent?.trim() || '';
      const teamName = row.querySelector('.tableCellParticipant__name')?.textContent?.trim() || '';

      const cells = row.querySelectorAll('.table__cell--value');
      const values = Array.from(cells).map(c => c.textContent.trim());

      const entry = { rank, team: teamName };
      headers.forEach((header, index) => {
        if (!header.includes('#') && !header.toLowerCase().includes('team')) {
          entry[header] = values[index] || '';
        }
      });

      if (teamName) {
        standings.push(entry);
      }
    });

    return standings;
  });

  await page.close();
  return standingsData;
};

export const getCountriesAndLeagues = async (browser) => {
  const MAX_EXPANSION_ATTEMPTS = 10;
  const EXPANSION_WAIT_MS = 500;

  // Phase 1: collect all unique country links from the main basketball page
  const mainPage = await browser.newPage();
  console.log(`Opening URL: ${BASKETBALL_URL}/`);
  await mainPage.goto(`${BASKETBALL_URL}/`, { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Click "Show more" in the left menu to reveal all countries
  try {
    for (let i = 0; i < MAX_EXPANSION_ATTEMPTS; i++) {
      const showMoreClicked = await mainPage.evaluate(() => {
        // Try class-based selectors first (Flashscore uses lmc__showMore or similar)
        const classSelectors = [
          '.lmc__showMore',
          '.showMore',
          '.show-more',
          '[class*="showMore"]',
          '[class*="show-more"]',
          '[class*="ShowMore"]',
        ];
        for (const sel of classSelectors) {
          const el = document.querySelector(sel);
          if (el) {
            const style = window.getComputedStyle(el);
            if (style.display !== 'none' && style.visibility !== 'hidden') {
              el.click();
              return true;
            }
          }
        }

        // Fallback: text-based search in the left menu
        const leftMenu = document.getElementById('category-left-menu');
        if (!leftMenu) return false;
        const controls = leftMenu.querySelectorAll('a, button, [role="button"]');
        for (const control of controls) {
          const style = window.getComputedStyle(control);
          if (style.display === 'none' || style.visibility === 'hidden') continue;
          const href = (control.getAttribute('href') || '').toLowerCase();
          if (href.includes('/basketball/')) continue;
          const text = control.textContent.trim().toLowerCase();
          const normalizedText = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          if (
            normalizedText.startsWith('show more') ||
            normalizedText.startsWith('mostrar mas') ||
            normalizedText.startsWith('ver mas') ||
            normalizedText.startsWith('click here') ||
            normalizedText.startsWith('haz clic aqui') ||
            normalizedText === 'more' ||
            normalizedText.includes('show all')
          ) {
            control.click();
            return true;
          }
        }
        return false;
      });
      if (!showMoreClicked) break;
      await new Promise(resolve => setTimeout(resolve, EXPANSION_WAIT_MS));
    }
  } catch (error) {
    // If clicking "Show more" fails, continue with whatever countries are already visible
    console.warn('Failed to click Show more:', error.message);
  }

  const countries = await mainPage.evaluate(() => {
    const seen = new Set();
    const results = [];

    const addCountry = (name, href) => {
      const slug = href.replace(/^\/|\/$/g, '').split('/')[1] || '';
      if (slug && !seen.has(slug)) {
        seen.add(slug);
        results.push({ country: name || slug, countryHref: href });
      }
    };

    // Primary: #category-left-menu – look for /basketball/{country}/ links
    const leftMenu = document.getElementById('category-left-menu');
    if (leftMenu) {
      leftMenu.querySelectorAll('a[href]').forEach((a) => {
        const href = a.getAttribute('href') || '';
        const parts = href.replace(/^\/|\/$/g, '').split('/');
        if (parts[0] === 'basketball' && parts.length === 2 && parts[1]) {
          addCountry(a.textContent.trim(), href);
        }
      });

      // Derive countries from league links when no explicit country link exists
      if (results.length === 0) {
        leftMenu.querySelectorAll('a[href]').forEach((a) => {
          const href = a.getAttribute('href') || '';
          const parts = href.replace(/^\/|\/$/g, '').split('/');
          if (parts[0] === 'basketball' && parts.length >= 3 && parts[1]) {
            addCountry(parts[1], '/basketball/' + parts[1] + '/');
          }
        });
      }
    }

    // Fallback: legacy .lmc__block selectors
    if (results.length === 0) {
      document.querySelectorAll('.lmc__block').forEach((block) => {
        const countryEl = block.querySelector('.lmc__blockName');
        const name = countryEl ? countryEl.textContent.trim() : '';
        const href = countryEl
          ? (countryEl.closest('a')?.getAttribute('href') || countryEl.querySelector('a')?.getAttribute('href') || '')
          : '';
        if (name && href) addCountry(name, href);
      });
    }

    return results;
  });

  await mainPage.close();

  // Phase 2: visit each country page to collect ALL its leagues
  const allResults = [];

  for (const countryData of countries) {
    const countryPage = await browser.newPage();
    const countryUrl = `https://www.flashscore.com${countryData.countryHref}`;
    console.log(`Opening URL: ${countryUrl}`);
    try {
      // Country pages can be slower to load than the main page; use a generous timeout
      await countryPage.goto(countryUrl, { waitUntil: 'networkidle2', timeout: 60000 });
      await new Promise(resolve => setTimeout(resolve, 1000));

      const leagues = await countryPage.evaluate((countryHref) => {
        const seen = new Set();
        const results = [];
        const countrySlug = countryHref.replace(/^\/|\/$/g, '').split('/')[1] || '';

        const addLeague = (name, href) => {
          const parts = href.replace(/^\/|\/$/g, '').split('/');
          const leagueSlug = parts[2] || '';
          if (leagueSlug && !seen.has(leagueSlug)) {
            seen.add(leagueSlug);
            results.push({ league: name || leagueSlug, leagueHref: href });
          }
        };

        // Primary: left menu on the country page
        const leftMenu = document.getElementById('category-left-menu');
        if (leftMenu) {
          leftMenu.querySelectorAll('a[href]').forEach((a) => {
            const href = a.getAttribute('href') || '';
            const parts = href.replace(/^\/|\/$/g, '').split('/');
            if (parts[0] === 'basketball' && parts[1] === countrySlug && parts.length >= 3 && parts[2]) {
              addLeague(a.textContent.trim(), href);
            }
          });
        }

        // Fallback: scan all page links for league-level URLs belonging to this country
        if (results.length === 0) {
          document.querySelectorAll('a[href]').forEach((a) => {
            const href = a.getAttribute('href') || '';
            const parts = href.replace(/^\/|\/$/g, '').split('/');
            if (parts[0] === 'basketball' && parts[1] === countrySlug && parts.length >= 3 && parts[2]) {
              addLeague(a.textContent.trim(), href);
            }
          });
        }

        return results;
      }, countryData.countryHref);

      if (leagues.length > 0) {
        leagues.forEach((l) => {
          allResults.push({
            country: countryData.country,
            countryHref: countryData.countryHref,
            league: l.league,
            leagueHref: l.leagueHref,
          });
        });
      } else {
        allResults.push({
          country: countryData.country,
          countryHref: countryData.countryHref,
          league: '',
          leagueHref: '',
        });
      }
    } catch (error) {
      console.warn(`Failed to load country page for ${countryData.country}: ${error.message}`);
      allResults.push({
        country: countryData.country,
        countryHref: countryData.countryHref,
        league: '',
        leagueHref: '',
      });
    } finally {
      await countryPage.close();
    }
  }

  return allResults;
};

export const getMatchLineups = async (browser, matchId) => {
  const page = await browser.newPage();
  const url = `${BASE_URL}/match/${matchId}/#/match-summary/lineups`;
  console.log(`Opening URL: ${url}`);
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(resolve => setTimeout(resolve, 2000));

  const lineupData = await page.evaluate(() => {
    const result = { home: [], away: [] };

    const homeSection = document.querySelector('.section--homeTeam, .lf__side--home');
    const awaySection = document.querySelector('.section--awayTeam, .lf__side--away');

    if (homeSection) {
      const players = homeSection.querySelectorAll('.lf__participantRow, .lineup__player');
      players.forEach((p) => {
        const name = p.querySelector('.lf__participantName, .lineup__playerName')?.textContent?.trim() || '';
        const number = p.querySelector('.lf__participantNumber, .lineup__playerNumber')?.textContent?.trim() || '';
        const position = p.querySelector('.lf__participantPosition, .lineup__playerPosition')?.textContent?.trim() || '';
        if (name) {
          result.home.push({ number, name, position });
        }
      });
    }

    if (awaySection) {
      const players = awaySection.querySelectorAll('.lf__participantRow, .lineup__player');
      players.forEach((p) => {
        const name = p.querySelector('.lf__participantName, .lineup__playerName')?.textContent?.trim() || '';
        const number = p.querySelector('.lf__participantNumber, .lineup__playerNumber')?.textContent?.trim() || '';
        const position = p.querySelector('.lf__participantPosition, .lineup__playerPosition')?.textContent?.trim() || '';
        if (name) {
          result.away.push({ number, name, position });
        }
      });
    }

    return result;
  });

  await page.close();
  return lineupData;
};
