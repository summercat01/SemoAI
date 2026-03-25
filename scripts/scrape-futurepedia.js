/**
 * Scrapes all AI tools from futurepedia.io
 * Strategy:
 *   1. Fetch all category pages to collect tool slugs
 *   2. Use Playwright to visit each /tool/[slug] page and extract external URL
 *   3. Generate Korean descriptions via Claude Haiku
 *   4. Insert into DB
 *
 * Run: node scripts/scrape-futurepedia.js [--limit N] [--dry-run] [--skip-collection]
 */

const { chromium } = require('playwright');
const { Client } = require('pg');
const Anthropic = require('@anthropic-ai/sdk').default;
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const db = new Client({ connectionString: process.env.DATABASE_URL });

const args = process.argv.slice(2);
const LIMIT = args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1]) : 9999;
const DRY_RUN = args.includes('--dry-run');
const SKIP_COLLECTION = args.includes('--skip-collection');
const SLUGS_CACHE = path.join(__dirname, 'futurepedia-slugs.json');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const SKIP_DOMAINS = new Set([
  'futurepedia.io', 'github.com', 'facebook.com', 'instagram.com',
  'linkedin.com', 'twitter.com', 'x.com', 'youtube.com', 'discord.com',
  'discord.gg', 'tiktok.com', 'reddit.com', 'medium.com', 'producthunt.com',
  'apple.com', 'play.google.com', 'apps.apple.com',
]);

const CATEGORY_MAP = {
  'chatbots': 'chatbot',
  'text-generators': 'writing',
  'writing-generators': 'writing',
  'paraphrasing': 'writing',
  'translators': 'writing',
  'storyteller': 'writing',
  'image': 'image-generation',
  'image-generators': 'image-generation',
  'image-editing': 'image-generation',
  'text-to-image': 'image-generation',
  'art': 'image-generation',
  'art-generators': 'image-generation',
  '3D-generator': 'image-generation',
  'cartoon-generators': 'image-generation',
  'portrait-generators': 'image-generation',
  'avatar-generator': 'image-generation',
  'design-generators': 'design',
  'presentations': 'design',
  'website-builders': 'design',
  'video': 'video',
  'video-generators': 'video',
  'video-editing': 'video',
  'video-enhancer': 'video',
  'text-to-video': 'video',
  'audio-generators': 'music',
  'music-generator': 'music',
  'text-to-speech': 'music',
  'audio-editing': 'music',
  'code': 'coding',
  'code-assistant': 'coding',
  'sql-assistant': 'coding',
  'no-code': 'coding',
  'business': 'business',
  'automations': 'business',
  'workflows': 'business',
  'productivity': 'business',
  'personal-assistant': 'business',
  'marketing': 'business',
  'seo': 'business',
  'social-media': 'business',
  'sales-assistant': 'business',
  'customer-support': 'business',
  'human-resources': 'business',
  'finance': 'business',
  'spreadsheet-assistant': 'business',
  'research-assistant': 'business',
  'project-management': 'business',
  'e-commerce': 'business',
  'legal': 'business',
  'health': 'business',
  'fitness': 'business',
  'travel': 'business',
  'gift-ideas': 'business',
  'stock-trading': 'business',
  'churn-management': 'business',
  'ticketing-management': 'business',
  'fashion-assistant': 'design',
  'education': 'education',
  'students': 'education',
  'teachers': 'education',
  'ai-agents': 'business',
  'prompt-generators': 'writing',
  'religion': 'chatbot',
  'ai-detection': 'business',
  'misc-tools': 'business',
};

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9' },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

async function getAllCategories() {
  // Get categories from sitemap for complete coverage
  const sitemapHtml = await fetchHtml('https://futurepedia.io/sitemap.xml');
  const cats = [...new Set([...sitemapHtml.matchAll(/futurepedia\.io\/ai-tools\/([a-z0-9A-Z-]+)/g)].map(m => m[1]))]
    .filter(c => c && !c.includes('/') && c !== 'best');
  return cats;
}

async function getToolSlugsFromCategory(categorySlug) {
  const slugs = new Set();
  let page = 1;
  let prevSize = -1;

  while (true) {
    try {
      const url = `https://futurepedia.io/ai-tools/${categorySlug}?page=${page}`;
      const html = await fetchHtml(url);

      const pageslugs = [...new Set([...html.matchAll(/\/tool\/([a-z0-9-]+)/g)].map(m => m[1]))];
      if (pageslugs.length === 0) break;

      pageslugs.forEach(s => slugs.add(s));

      // Stop if no new slugs were added (duplicate page = no more server-side pagination)
      if (slugs.size === prevSize) break;
      prevSize = slugs.size;

      page++;
      await new Promise(r => setTimeout(r, 200));
    } catch (e) {
      if (e.message.includes('404') || e.message.includes('HTTP 4')) break;
      console.log(`  ${categorySlug} p${page}: ERROR ${e.message.slice(0, 50)}`);
      break;
    }
  }

  return [...slugs].map(slug => ({ slug, category: CATEGORY_MAP[categorySlug] ?? 'business', categorySlug }));
}

async function getServiceDetails(page, slug) {
  try {
    await page.goto(`https://futurepedia.io/tool/${slug}`, {
      waitUntil: 'domcontentloaded', timeout: 20000,
    });

    const name = await page.$eval('h1', el => el.textContent.trim()).catch(() => '');
    const description = await page.$eval('meta[name="description"]', el => el.content).catch(() => '');

    // Get pricing from page
    const pricingText = await page.evaluate(() => {
      const el = document.querySelector('[class*="pricing"], [class*="price"], [class*="badge"]');
      return el ? el.textContent.trim().toLowerCase() : '';
    }).catch(() => '');

    let pricingType = 'freemium';
    if (pricingText.includes('free') && !pricingText.includes('freemium')) pricingType = 'free';
    else if (pricingText.includes('freemium')) pricingType = 'freemium';
    else if (pricingText.includes('paid') || pricingText.includes('contact')) pricingType = 'paid';

    // Find external website URL - look for "Visit" links
    const externalUrl = await page.evaluate((skipDomains) => {
      const links = [...document.querySelectorAll('a[href^="http"]')];
      for (const link of links) {
        try {
          const hostname = new URL(link.href).hostname.replace('www.', '');
          if (!skipDomains.some(d => hostname.includes(d))) {
            // Clean UTM params
            const u = new URL(link.href);
            ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
             'ref', 'via', 'aff', 'partner', 'fpr', 'linkId', 'sourceId'].forEach(p => u.searchParams.delete(p));
            return u.toString().replace(/\?$/, '');
          }
        } catch {}
      }
      return null;
    }, [...SKIP_DOMAINS]).catch(() => null);

    return { name: name || slug, description, websiteUrl: externalUrl, pricingType };
  } catch (e) {
    return { name: slug, description: '', websiteUrl: null, pricingType: 'freemium' };
  }
}

async function generateKoreanInfo(name, description, categorySlug) {
  const prompt = `Describe AI service "${name}" for Korean users.
Description: ${(description || 'AI tool').slice(0, 200)}
Category: ${categorySlug}
Return JSON only: {"tagline":"Korean max 80chars","target_user":"Korean 1 sentence","key_features":"Korean 2-3 comma separated","limitations":"Korean 1 sentence","skill_level":"beginner|intermediate|advanced|any","tags":["3-5 from: no-code,beginner,developer,web,mobile,api,free,korean,realtime,open-source,photo-editing,character,webtoon,story,translation,summarization,code-generation,tts"]}`;

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    messages: [{ role: 'user', content: prompt }],
  });
  const text = response.content[0].text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  return JSON.parse(text);
}

async function main() {
  await db.connect();
  console.log('Connected to database\n');

  const { rows: categories } = await db.query('SELECT id, slug FROM categories');
  const categoryMap = Object.fromEntries(categories.map(c => [c.slug, c.id]));
  const { rows: tags } = await db.query('SELECT id, slug FROM tags');
  const tagMap = Object.fromEntries(tags.map(t => [t.slug, t.id]));
  const { rows: existing } = await db.query('SELECT slug FROM ai_services');
  const existingSlugs = new Set(existing.map(r => r.slug));
  console.log(`Existing: ${existingSlugs.size} services\n`);

  // Phase 1: Collect slugs
  let allApps;
  if (SKIP_COLLECTION && fs.existsSync(SLUGS_CACHE)) {
    allApps = JSON.parse(fs.readFileSync(SLUGS_CACHE, 'utf8'));
    console.log(`Loaded ${allApps.length} slugs from cache`);
  } else {
    console.log('Phase 1: Collecting tool slugs from category pages...');
    const categoryList = await getAllCategories();
    console.log(`Found categories: ${categoryList.join(', ')}\n`);

    allApps = [];
    const seenSlugs = new Set();

    for (const catSlug of categoryList) {
      try {
        const tools = await getToolSlugsFromCategory(catSlug);
        const newTools = tools.filter(t => !seenSlugs.has(t.slug));
        newTools.forEach(t => seenSlugs.add(t.slug));
        allApps.push(...newTools);
        console.log(`  → ${catSlug}: ${tools.length} found, ${newTools.length} unique (total: ${allApps.length})`);
        await new Promise(r => setTimeout(r, 500));
      } catch (e) {
        console.log(`  ${catSlug}: ERROR ${e.message}`);
      }
    }

    fs.writeFileSync(SLUGS_CACHE, JSON.stringify(allApps, null, 2));
    console.log(`\nSaved ${allApps.length} slugs to cache`);
  }

  // Filter new ones
  const toProcess = allApps
    .filter(a => {
      const dbSlug = a.slug.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      return !existingSlugs.has(dbSlug);
    })
    .slice(0, LIMIT);

  console.log(`\nNew to process: ${toProcess.length}`);

  if (DRY_RUN) {
    console.log('DRY RUN - first 20:');
    toProcess.slice(0, 20).forEach(a => console.log(`  ${a.slug} | ${a.category}`));
    await db.end();
    return;
  }

  // Phase 2: Get details + generate Korean + insert
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setExtraHTTPHeaders({ 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9' });

  let inserted = 0, skipped = 0, errors = 0;

  for (let i = 0; i < toProcess.length; i++) {
    const app = toProcess[i];
    const dbSlug = app.slug.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    process.stdout.write(`[${i + 1}/${toProcess.length}] ${app.slug}...`);

    try {
      const details = await getServiceDetails(page, app.slug);
      if (!details.websiteUrl) { skipped++; console.log(' ✗ no URL'); continue; }

      const info = await generateKoreanInfo(details.name, details.description, app.categorySlug);
      const categoryId = categoryMap[app.category] ?? categoryMap['business'];

      const { rows } = await db.query(
        `INSERT INTO ai_services (name, slug, tagline, description, category_id, website_url, pricing_type, skill_level, platforms, target_user, key_features, limitations)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
         ON CONFLICT (slug) DO NOTHING RETURNING id`,
        [details.name, dbSlug, info.tagline, details.description || info.tagline,
         categoryId, details.websiteUrl, details.pricingType, info.skill_level, ['web'],
         info.target_user, info.key_features, info.limitations]
      );

      if (rows.length > 0) {
        const serviceId = rows[0].id;
        for (const tagSlug of (info.tags || [])) {
          const tagId = tagMap[tagSlug];
          if (tagId) await db.query(
            `INSERT INTO ai_service_tags VALUES ($1,$2) ON CONFLICT DO NOTHING`,
            [serviceId, tagId]
          );
        }
        inserted++;
        console.log(` ✓ ${details.name}`);
      } else {
        skipped++;
        console.log(' (dup)');
      }

      await new Promise(r => setTimeout(r, 250));

      if ((i + 1) % 100 === 0) {
        console.log(`\n--- [${i + 1}/${toProcess.length}] inserted=${inserted} skipped=${skipped} errors=${errors} ---\n`);
      }
    } catch (err) {
      errors++;
      console.log(` ✗ ${err.message.slice(0, 60)}`);
    }
  }

  await page.close();
  await browser.close();

  console.log(`\n=== DONE ===`);
  console.log(`inserted=${inserted}, skipped=${skipped}, errors=${errors}`);
  console.log(`Total in DB: ~${existingSlugs.size + inserted}`);
  await db.end();
}

main().catch(err => { console.error(err); process.exit(1); });
