npm run start country=spain league=acb action=results headless

npm run start country=spain league=acb action=results ids=g_3_b9ZLA6rq headless

npm run start country=spain league=acb action=fixtures headless

npm run start-urls -- --url https://www.flashscore.com/basketball/spain/acb 

npm run start country=spain league=acb action=fixtures ids=g_3_2wljGSKL headless

npm run start country=spain league=acb action=results ids=g_3_2wljGSKL headless

npm run start country=spain league=acb action=results ids=g_3_2wljGSKL includeMatchData=false headless

npm run start country=spain league=acb action=results ids=g_3_2wljGSKL includeMatchData=true includeStatsPlayer=false includeStatsMatch=false includePointByPoint=false headless

npm run start-results spain acb results headless

npm install

npm run start country=spain league=acb action=fixtures generateCSV=true

npm run start country=spain league=acb action=fixtures ids=g_3_2wljGSKL generateCSV=true headless

npm run start country=spain league=acb action=results generateCSV=true

npm run start country=spain league=acb action=fixtures generateCSV=true


---

docker build -t flashscore-scraping:1.0.0 .


docker run flashscore-scraping:1.0.0
