
# FlashscoreScraping

A Node.js + Puppeteer scraper for [Flashscore](https://www.flashscore.com) basketball data. It can collect match results, fixtures, standings, player stats, match stats, point-by-point play, odds, head-to-head records, and team lineups, exporting everything as CSV files.

---

## Table of Contents

- [Requirements](#requirements)
- [Installation](#installation)
- [Available npm Scripts](#available-npm-scripts)
- [CLI Arguments](#cli-arguments)
  - [Actions](#actions)
  - [Data-Extraction Flags](#data-extraction-flags)
- [Usage Examples](#usage-examples)
  - [Local npm Usage](#local-npm-usage)
  - [Docker Usage](#docker-usage)
- [Output Structure](#output-structure)
- [Logging](#logging)

---

## Requirements

- **Node.js** 18 or later
- **npm** 9 or later
- Google Chrome / Chromium (installed automatically by Puppeteer on `npm install`)
- Docker & Docker Compose *(optional, for containerised runs)*

---

## Installation

```bash
git clone https://github.com/juanfranciscofernandezherreros/FlashscoreScraping.git
cd FlashscoreScraping
npm install
```

---

## Available npm Scripts

| Script | Command | Description |
|---|---|---|
| `start` | `node src/index.js` | Main entry point — accepts all CLI arguments below |
| `basketball` | `node src/scrapeAllBasketball.js` | Scrape all basketball results from the Flashscore basketball home page |
| `basketball:detailed` | `node src/scrapeAllBasketball.js detailed=true` | Same as above but also exports per-match detailed CSVs |
| `competitions` | `node src/scrapeCountries.js` | List and export all available countries and leagues |
| `results` | `node src/competitionResults.cjs <country> <league>` | Download historical results for a specific competition |
| `fixtures` | `node src/competitionFixtures.cjs <country> <league>` | Download upcoming fixtures for a specific competition |
| `standings` | `node src/index.js action=standings` | Export league standings to CSV |
| `build-links` | `node src/index.js action=build-links` | Print all match links for a competition to the log |
| `read-csv` | `node src/readAllCsv.js` | Read and display all generated CSV files |
| `print-csv` | `node src/printCsv.js` | Print all CSV file contents under `src/csv/` to the console |
| `test` | `node src/testBasketballCsv.js && node src/testAllFunctionalities.js` | Run the test suite |

---

## CLI Arguments

All arguments are passed as `key=value` pairs to `npm run start` (or `node src/index.js`).

### Actions

| Argument | Values | Description |
|---|---|---|
| `country` | e.g. `spain`, `world` | Country/region to filter by |
| `league` | e.g. `acb`, `nba`, `acb-2005-2006` | League or season slug |
| `ids` | Comma-separated match IDs | Process one or more specific matches by ID (e.g. `g_3_Uix0vJJK,g_3_0A5LCOZF`) |
| `competition` | e.g. `acb-2024-2025` | Optional override for the output folder name |
| `action` | `results` \| `fixtures` \| `standings` \| `build-links` | High-level action to run |

### Data-Extraction Flags

These flags control which data is extracted for each match. Combine as many as needed.

| Flag | Description |
|---|---|
| `includeMatchData=true` | Match summary (teams, scores, date, venue…) |
| `includeStatsPlayer=true` | Individual player statistics |
| `includeStatsMatch=true` | Team/match statistics per period (0–4) |
| `includePointByPoint=true` | Play-by-play events per period (0–4) |
| `includeOdds=true` | Betting odds and over/under lines |
| `includeH2H=true` | Head-to-head historical record |
| `includeLineups=true` | Starting lineups for both teams |
| `includeStandings=true` | League standings (combined with `action=results`) |
| `includeAll=true` | Enable **all** of the above flags at once |

---

## Usage Examples

### Local npm Usage

```bash
# Extract match summary for a single match
npm run start -- ids=g_3_Uix0vJJK includeMatchData=true

# Extract player stats for a single match
npm run start -- ids=g_3_0A5LCOZF includeStatsPlayer=true

# Extract per-period match stats
npm run start -- ids=g_3_Uix0vJJK includeStatsMatch=true

# Extract point-by-point play
npm run start -- ids=g_3_Uix0vJJK includePointByPoint=true

# Extract all data for a single match
npm run start -- ids=g_3_Uix0vJJK includeAll=true

# Download all results for a competition (current season)
npm run start -- country=spain league=acb action=results

# Download all results including all per-match data
npm run start -- country=spain league=acb action=results includeAll=true

# Download historical results for a specific season
npm run results -- spain acb-2005-2006

# Download upcoming fixtures
npm run fixtures -- world olympic-games

# Export league standings
npm run start -- country=spain league=acb action=standings

# Scrape all live basketball results from Flashscore homepage
npm run basketball

# Same, with per-match detailed CSVs (summary, stats, odds, h2h, lineups)
npm run basketball:detailed

# List all available countries and leagues
npm run competitions

# Print all generated CSV files to the console
npm run print-csv
```

### Docker Usage

#### Build the image

```bash
docker build -t flashscore-scraping .
```

#### Run with docker-compose

```bash
# Build the image
docker-compose build

# Extract match summary (output saved to ./src/csv and ./logs)
docker-compose run --rm app node src/index.js ids=g_3_Uix0vJJK includeMatchData=true

# Extract player stats
docker-compose run --rm app node src/index.js ids=g_3_0A5LCOZF includeStatsPlayer=true

# Extract match stats
docker-compose run --rm app node src/index.js ids=g_3_Uix0vJJK includeStatsMatch=true

# Extract point-by-point play
docker-compose run --rm app node src/index.js ids=g_3_Uix0vJJK includePointByPoint=true

# Download competition results
docker-compose run --rm app node src/index.js country=spain league=acb action=results

# Historical results for a specific season
docker-compose run --rm app node src/competitionResults.cjs spain acb-2005-2006

# Upcoming fixtures
docker-compose run --rm app node src/competitionFixtures.cjs world olympic-games
```

#### Run directly with docker run

```bash
docker run --rm \
  --shm-size=256m \
  -v "$(pwd)/src/csv:/app/src/csv" \
  -v "$(pwd)/logs:/app/logs" \
  flashscore-scraping \
  node src/index.js country=spain league=acb action=results includeAll=true
```

---

## Output Structure

All CSV files are written under `src/csv/`:

```
src/csv/
├── results/
│   ├── <country>_<league>/              # or <competition> if specified
│   │   ├── RESULTS_<date>_<country>_<league>.csv
│   │   ├── STANDINGS_<country>_<league>.csv
│   │   └── <matchId>/
│   │       ├── MATCH_SUMMARY_<matchId>.csv
│   │       ├── STATS_PLAYER_<matchId>.csv
│   │       ├── STATS_MATCH_<matchId>_<period>.csv   # period 0–4
│   │       ├── POINT_BY_POINT_<matchId>_<period>.csv
│   │       ├── ODDS_<matchId>.csv
│   │       ├── OVER_UNDER_<matchId>.csv
│   │       ├── H2H_<matchId>.csv
│   │       └── LINEUPS_<matchId>.csv
│   └── ALL_BASKETBALL_RESULTS_<date>.csv            # from npm run basketball
├── fixtures/
│   └── FIXTURES_<country>_<league>.csv
└── COUNTRIES_LEAGUES_<date>.csv                     # from npm run competitions
```

---

## Logging

Log files are created daily under the `logs/` directory:

| File | Content |
|---|---|
| `logs/info_<DD_MM_YYYY>.log` | Informational messages (files created, matches processed…) |
| `logs/error_<DD_MM_YYYY>.log` | Errors encountered during scraping |
| `logs/warning_<DD_MM_YYYY>.log` | Non-fatal warnings (e.g. CSV already exists, data unavailable) |

