import { buildArchiveUrl, filterSeasonEntries, resolveSourceUrl } from './extractLeagueSeasons.js';

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

async function testResolveSourceUrl() {
  console.log('\n--- Test: resolveSourceUrl converts github blob URL ---');
  const result = resolveSourceUrl('https://github.com/example/repo/blob/main/file.csv');
  assert(result === 'https://raw.githubusercontent.com/example/repo/main/file.csv', `Converted to raw URL (got ${result})`);
}

async function testBuildArchiveUrl() {
  console.log('\n--- Test: buildArchiveUrl appends archive path ---');
  assert(
    buildArchiveUrl('/basketball/australia/nbl1-south/') === 'https://www.flashscore.com/basketball/australia/nbl1-south/archive/',
    'Relative league href is converted to full archive URL',
  );
  assert(
    buildArchiveUrl('https://www.flashscore.com/basketball/australia/nbl1-south/') === 'https://www.flashscore.com/basketball/australia/nbl1-south/archive/',
    'Absolute league href is converted to archive URL',
  );
  assert(
    buildArchiveUrl('https://www.flashscore.com/basketball/australia/nbl1-south/archive/') === 'https://www.flashscore.com/basketball/australia/nbl1-south/archive/',
    'Already-archive URL remains unchanged',
  );
}

async function testFilterSeasonEntries() {
  console.log('\n--- Test: filterSeasonEntries keeps only valid unique seasons ---');
  const rows = filterSeasonEntries([
    { text: '2024/2025', href: 'https://www.flashscore.com/basketball/spain/acb-2024-2025/' },
    { text: '2024/2025', href: 'https://www.flashscore.com/basketball/spain/acb-2024-2025/' },
    { text: 'Archive', href: 'https://www.flashscore.com/basketball/spain/acb/archive/' },
    { text: '2023/2024', href: 'https://www.flashscore.com/basketball/spain/acb-2023-2024/' },
  ]);

  assert(rows.length === 2, `Only two valid unique seasons are kept (got ${rows.length})`);
  assert(rows[0].season === '2024/2025', 'First season text is preserved');
  assert(rows[1].seasonHref.includes('2023-2024'), 'Second season URL is preserved');
}

(async () => {
  console.log('=== Extract League Seasons Tests ===');
  await testResolveSourceUrl();
  await testBuildArchiveUrl();
  await testFilterSeasonEntries();

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
  if (failed > 0) process.exit(1);
})();
