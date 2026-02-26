
# FlashscoreScraping

A Node.js + Puppeteer scraper for Flashscore basketball data.

## Docker Usage

### Build the image

```bash
docker build -t flashscore-scraping .
```

### Run with docker-compose

```bash
# Build and start
docker-compose build

# Run a specific command (output saved to ./src/csv and ./logs)
docker-compose run --rm app node src/index.js ids=g_3_Uix0vJJK includeMatchData=true headless

docker-compose run --rm app node src/index.js ids=g_3_0A5LCOZF includeStatsPlayer=true headless

docker-compose run --rm app node src/index.js ids=g_3_Uix0vJJK includeStatsMatch=true headless

docker-compose run --rm app node src/index.js ids=g_3_Uix0vJJK includePointByPoint=true headless

docker-compose run --rm app node src/index.js country=spain league=acb action=results headless

docker-compose run --rm app node src/competitionResults.cjs spain acb-2005-2006

docker-compose run --rm app node src/competitionFixtures.cjs world olympic-games
```

### Run directly with docker run

```bash
docker run --rm \
  --shm-size=256m \
  -v "$(pwd)/src/csv:/app/src/csv" \
  -v "$(pwd)/logs:/app/logs" \
  flashscore-scraping \
  node src/index.js country=spain league=acb action=results
```

## Local npm Usage

npm run start ids=g_3_Uix0vJJK includeMatchData=true headless

npm run start ids=g_3_0A5LCOZF includeStatsPlayer=true headless

npm run start ids=g_3_Uix0vJJK includeStatsMatch=true headless

npm run start ids=g_3_Uix0vJJK includePointByPoint=true headless

npm run start country=spain league=acb action=results headless

npm run results -- spain acb-2005-2006

npm run fixtures -- world olympic-games

