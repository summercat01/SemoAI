const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Intercept ALL requests
  const allCalls = [];
  page.on('request', req => allCalls.push(req.url()));

  // Also intercept responses to find tool data
  page.on('response', async res => {
    const url = res.url();
    if (url.includes('tool') || url.includes('product') || url.includes('apps')) {
      try {
        const text = await res.text().catch(() => '');
        if (text.includes('"website"') || text.includes('"slug"')) {
          console.log('FOUND DATA at:', url, '- size:', text.length);
          console.log('Preview:', text.slice(0, 300));
        }
      } catch {}
    }
  });

  await page.goto('https://aitools.fyi/category/productivity', { waitUntil: 'networkidle' });

  // Scroll to trigger lazy load
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);
  }

  // Count tool links now
  const toolLinks = await page.$$eval('[href*="/tool/"]', els =>
    [...new Set(els.map(el => el.getAttribute('href')))]
  );
  console.log('\nTool links:', toolLinks.length, toolLinks.slice(0, 5));

  // Show all unique API calls
  const uniqueCalls = [...new Set(allCalls)].filter(u => !u.includes('static') && !u.includes('chunk'));
  console.log('\nAll API calls:');
  uniqueCalls.forEach(u => console.log(' ', u));

  await browser.close();
})().catch(e => console.error(e));
