import puppeteer from "puppeteer";

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.goto('https://www.flashscore.com/basketball/', { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise(resolve => setTimeout(resolve, 3000));

    const leftMenuInfo = await page.evaluate(() => {
      const info = {};

      const leftMenu = document.getElementById('category-left-menu');
      info.hasLeftMenu = !!leftMenu;
      if (leftMenu) {
        info.leftMenuHTML = leftMenu.innerHTML.substring(0, 5000);
        info.leftMenuChildCount = leftMenu.children.length;

        const anchors = leftMenu.querySelectorAll('a');
        info.totalAnchors = anchors.length;
        info.sampleAnchors = [];
        anchors.forEach((a, i) => {
          if (i < 30) {
            info.sampleAnchors.push({
              href: a.getAttribute('href'),
              text: a.textContent.trim().substring(0, 50),
              className: a.className,
              parentClass: a.parentElement?.className,
              grandparentClass: a.parentElement?.parentElement?.className,
            });
          }
        });
      }

      const lmcBlocks = document.querySelectorAll('.lmc__block');
      info.lmcBlockCount = lmcBlocks.length;

      const lmcElements = document.querySelectorAll('[class*="lmc"]');
      info.lmcElementCount = lmcElements.length;
      info.lmcClasses = [];
      lmcElements.forEach((el, i) => {
        if (i < 10) info.lmcClasses.push(el.className);
      });

      return info;
    });

    console.log(JSON.stringify(leftMenuInfo, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();
