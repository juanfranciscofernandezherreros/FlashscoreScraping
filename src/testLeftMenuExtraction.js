import puppeteer from "puppeteer";

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

// Replicate the page.evaluate logic from getCountriesAndLeagues for unit testing
async function extractFromPage(page) {
  return await page.evaluate(() => {
    const results = [];

    const leftMenu = document.getElementById('category-left-menu');
    if (leftMenu) {
      const firstChild = leftMenu.querySelector(':scope > div');
      const hasNestedGroups = firstChild && firstChild.querySelector(':scope > div');
      const countryGroups = hasNestedGroups
        ? [
            ...firstChild.querySelectorAll(':scope > div'),
            ...Array.from(leftMenu.querySelectorAll(':scope > div')).filter((div) => div !== firstChild),
          ]
        : leftMenu.querySelectorAll(':scope > div');

      countryGroups.forEach((group) => {
        const anchors = group.querySelectorAll('a[href]');
        if (anchors.length === 0) return;

        let countryName = '';
        let countryHref = '';

        for (const a of anchors) {
          const href = a.getAttribute('href') || '';
          const parts = href.replace(/^\/|\/$/g, '').split('/');
          if (parts[0] === 'basketball' && parts.length === 2 && parts[1]) {
            countryName = a.textContent.trim() || parts[1];
            countryHref = href;
            break;
          }
        }

        if (!countryName && anchors.length > 0) {
          const href = anchors[0].getAttribute('href') || '';
          const parts = href.replace(/^\/|\/$/g, '').split('/');
          if (parts[0] === 'basketball' && parts.length >= 2) {
            countryName = anchors[0].textContent.trim() || parts[1];
            countryHref = '/basketball/' + parts[1] + '/';
          }
        }

        let leagueFound = false;
        anchors.forEach((a) => {
          const href = a.getAttribute('href') || '';
          const parts = href.replace(/^\/|\/$/g, '').split('/');
          if (parts[0] === 'basketball' && parts.length >= 3 && parts[2]) {
            leagueFound = true;
            results.push({
              country: countryName,
              countryHref,
              league: a.textContent.trim() || parts[2],
              leagueHref: href,
            });
          }
        });

        if (!leagueFound && countryName) {
          results.push({
            country: countryName,
            countryHref,
            league: '',
            leagueHref: '',
          });
        }
      });
    }

    // Fallback to old selectors
    if (results.length === 0) {
      const menuItems = document.querySelectorAll('.lmc__block');
      menuItems.forEach((block) => {
        const countryEl = block.querySelector('.lmc__blockName');
        const countryName = countryEl ? countryEl.textContent.trim() : '';
        const countryHref = countryEl ? (countryEl.closest('a')?.getAttribute('href') || countryEl.querySelector('a')?.getAttribute('href') || '') : '';
        const leagueElements = block.querySelectorAll('.lmc__item a, .lmc__element a');
        leagueElements.forEach((leagueEl) => {
          const leagueName = leagueEl.textContent.trim();
          const leagueHref = leagueEl.getAttribute('href') || '';
          if (leagueName) {
            results.push({ country: countryName, countryHref, league: leagueName, leagueHref });
          }
        });
        if (leagueElements.length === 0 && countryName) {
          results.push({ country: countryName, countryHref, league: '', leagueHref: '' });
        }
      });
    }

    return results;
  });
}

(async () => {
  console.log('=== getCountriesAndLeagues DOM Extraction Tests ===');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  // Test 1: New #category-left-menu structure with wrapper div
  console.log('\n--- Test: #category-left-menu with country groups ---');
  {
    const page = await browser.newPage();
    await page.setContent(`
      <div id="category-left-menu">
        <div>
          <div>
            <a href="/basketball/usa/">USA</a>
            <div>
              <a href="/basketball/usa/nba/">NBA</a>
              <a href="/basketball/usa/wnba/">WNBA</a>
            </div>
          </div>
          <div>
            <a href="/basketball/spain/">Spain</a>
            <div>
              <a href="/basketball/spain/acb/">ACB</a>
            </div>
          </div>
          <div>
            <a href="/basketball/germany/">Germany</a>
          </div>
        </div>
      </div>
    `);
    const results = await extractFromPage(page);
    assert(results.length === 4, `Found 4 entries (got ${results.length})`);
    assert(results[0].country === 'USA', `First entry country is USA (got ${results[0].country})`);
    assert(results[0].league === 'NBA', `First entry league is NBA (got ${results[0].league})`);
    assert(results[0].leagueHref === '/basketball/usa/nba/', `First entry leagueHref correct (got ${results[0].leagueHref})`);
    assert(results[0].countryHref === '/basketball/usa/', `First entry countryHref correct (got ${results[0].countryHref})`);
    assert(results[1].league === 'WNBA', `Second entry league is WNBA (got ${results[1].league})`);
    assert(results[2].country === 'Spain', `Third entry country is Spain (got ${results[2].country})`);
    assert(results[2].league === 'ACB', `Third entry league is ACB (got ${results[2].league})`);
    assert(results[3].country === 'Germany', `Fourth entry country is Germany (got ${results[3].country})`);
    assert(results[3].league === '', `Fourth entry has no league (got "${results[3].league}")`);
    await page.close();
  }

  // Test 2: Fallback to old .lmc__block selectors
  console.log('\n--- Test: category-left-menu includes groups after a banner sibling ---');
  {
    const page = await browser.newPage();
    await page.setContent(`
      <div id="category-left-menu">
        <div>
          <div>
            <a href="/basketball/usa/">USA</a>
            <div><a href="/basketball/usa/nba/">NBA</a></div>
          </div>
          <div>
            <a href="/basketball/spain/">Spain</a>
            <div><a href="/basketball/spain/acb/">ACB</a></div>
          </div>
        </div>
        <div class="banner"></div>
        <div>
          <a href="/basketball/argentina/">Argentina</a>
          <div><a href="/basketball/argentina/lnb/">LNB</a></div>
        </div>
      </div>
    `);
    const results = await extractFromPage(page);
    assert(results.length === 3, `Found 3 entries including post-banner group (got ${results.length})`);
    const hasArgentina = results.some(r => r.country === 'Argentina' && r.league === 'LNB');
    assert(hasArgentina, 'Found Argentina league after banner sibling');
    await page.close();
  }

  // Test 2: Fallback to old .lmc__block selectors
  console.log('\n--- Test: Fallback to .lmc__block selectors ---');
  {
    const page = await browser.newPage();
    await page.setContent(`
      <div class="lmc__block">
        <a class="lmc__blockName" href="/basketball/usa/">USA</a>
        <div class="lmc__item"><a href="/basketball/usa/nba/">NBA</a></div>
        <div class="lmc__element"><a href="/basketball/usa/wnba/">WNBA</a></div>
      </div>
    `);
    const results = await extractFromPage(page);
    assert(results.length === 2, `Fallback found 2 entries (got ${results.length})`);
    assert(results[0].country === 'USA', `Fallback country is USA (got ${results[0].country})`);
    assert(results[0].league === 'NBA', `Fallback first league is NBA (got ${results[0].league})`);
    assert(results[1].league === 'WNBA', `Fallback second league is WNBA (got ${results[1].league})`);
    await page.close();
  }

  // Test 3: Href parsing when anchor text is empty
  console.log('\n--- Test: Href parsing when text is empty ---');
  {
    const page = await browser.newPage();
    await page.setContent(`
      <div id="category-left-menu">
        <div>
          <div>
            <a href="/basketball/france/"></a>
            <div>
              <a href="/basketball/france/pro-a/"></a>
            </div>
          </div>
        </div>
      </div>
    `);
    const results = await extractFromPage(page);
    assert(results.length === 1, `Found 1 entry (got ${results.length})`);
    assert(results[0].country === 'france', `Country derived from href (got ${results[0].country})`);
    assert(results[0].league === 'pro-a', `League derived from href (got ${results[0].league})`);
    await page.close();
  }

  // Test 4: Empty page (no left menu, no lmc blocks)
  console.log('\n--- Test: Empty page returns empty results ---');
  {
    const page = await browser.newPage();
    await page.setContent('<div></div>');
    const results = await extractFromPage(page);
    assert(results.length === 0, `No results on empty page (got ${results.length})`);
    await page.close();
  }

  // Test 5: Multiple countries with multiple leagues (flat anchor structure)
  console.log('\n--- Test: Multiple countries with multiple leagues ---');
  {
    const page = await browser.newPage();
    await page.setContent(`
      <div id="category-left-menu">
        <div>
          <div>
            <a href="/basketball/usa/">USA</a>
            <a href="/basketball/usa/nba/">NBA</a>
            <a href="/basketball/usa/wnba/">WNBA</a>
            <a href="/basketball/usa/ncaa/">NCAA</a>
          </div>
          <div>
            <a href="/basketball/spain/">Spain</a>
            <a href="/basketball/spain/acb/">ACB</a>
            <a href="/basketball/spain/liga-femenina/">Liga Femenina</a>
          </div>
          <div>
            <a href="/basketball/turkey/">Turkey</a>
            <a href="/basketball/turkey/bsl/">BSL</a>
          </div>
        </div>
      </div>
    `);
    const results = await extractFromPage(page);
    assert(results.length === 6, `Found 6 entries (got ${results.length})`);
    const usaLeagues = results.filter(r => r.country === 'USA');
    assert(usaLeagues.length === 3, `USA has 3 leagues (got ${usaLeagues.length})`);
    const spainLeagues = results.filter(r => r.country === 'Spain');
    assert(spainLeagues.length === 2, `Spain has 2 leagues (got ${spainLeagues.length})`);
    const turkeyLeagues = results.filter(r => r.country === 'Turkey');
    assert(turkeyLeagues.length === 1, `Turkey has 1 league (got ${turkeyLeagues.length})`);
    await page.close();
  }

  // Test 6: No wrapper div (divs directly under left menu)
  console.log('\n--- Test: category-left-menu without wrapper div ---');
  {
    const page = await browser.newPage();
    await page.setContent(`
      <div id="category-left-menu">
        <div>
          <a href="/basketball/italy/">Italy</a>
          <a href="/basketball/italy/lega-basket/">Lega Basket</a>
        </div>
        <div>
          <a href="/basketball/greece/">Greece</a>
          <a href="/basketball/greece/a1/">A1</a>
        </div>
      </div>
    `);
    const results = await extractFromPage(page);
    assert(results.length === 2, `Found 2 entries (got ${results.length})`);
    const hasItaly = results.some(r => r.country === 'Italy');
    assert(hasItaly, 'Found Italy entries');
    const hasGreece = results.some(r => r.country === 'Greece');
    assert(hasGreece, 'Found Greece entries');
    await page.close();
  }

  // Test 7: "Show more" link reveals hidden country elements
  console.log('\n--- Test: Show more link reveals hidden countries ---');
  {
    const page = await browser.newPage();
    await page.setContent(`
      <div id="category-left-menu">
        <div>
          <div>
            <a href="/basketball/usa/">USA</a>
            <div>
              <a href="/basketball/usa/nba/">NBA</a>
            </div>
          </div>
          <div>
            <a href="/basketball/spain/">Spain</a>
            <div>
              <a href="/basketball/spain/acb/">ACB</a>
            </div>
          </div>
          <div class="hidden-country" style="display:none;">
            <a href="/basketball/albania/">Albania</a>
            <div>
              <a href="/basketball/albania/superliga/">Superliga</a>
            </div>
          </div>
          <div class="hidden-country" style="display:none;">
            <a href="/basketball/argentina/">Argentina</a>
            <div>
              <a href="/basketball/argentina/lnb/">LNB</a>
            </div>
          </div>
          <a href="#" id="show-more-link">Mostrar más</a>
        </div>
      </div>
      <script>
        document.getElementById('show-more-link').addEventListener('click', function(e) {
          e.preventDefault();
          document.querySelectorAll('.hidden-country').forEach(function(el) {
            el.style.display = '';
          });
          this.style.display = 'none';
        });
      </script>
    `);

    // Simulate clicking "Show more" like getCountriesAndLeagues does
    await page.evaluate(() => {
      const leftMenu = document.getElementById('category-left-menu');
      if (!leftMenu) return;
      const links = leftMenu.querySelectorAll('a');
      for (const link of links) {
        const text = link.textContent.trim().toLowerCase();
        const normalizedText = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (
          normalizedText === 'show more' ||
          normalizedText === 'show more...' ||
          normalizedText === 'mostrar mas' ||
          normalizedText === 'mostrar mas...' ||
          normalizedText === 'ver mas' ||
          normalizedText === 'ver mas...'
        ) {
          link.click();
          break;
        }
      }
    });
    await new Promise(resolve => setTimeout(resolve, 200));

    const results = await extractFromPage(page);
    assert(results.length === 4, `Found 4 entries after Show more (got ${results.length})`);
    const hasAlbania = results.some(r => r.country === 'Albania');
    assert(hasAlbania, 'Found Albania after Show more');
    const hasArgentina = results.some(r => r.country === 'Argentina');
    assert(hasArgentina, 'Found Argentina after Show more');
    const hasUSA = results.some(r => r.country === 'USA');
    assert(hasUSA, 'Still has USA after Show more');
    const hasSpain = results.some(r => r.country === 'Spain');
    assert(hasSpain, 'Still has Spain after Show more');
    await page.close();
  }

  await browser.close();

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
  if (failed > 0) process.exit(1);
})();
