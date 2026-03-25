/**
 * Scrapes all AI tools from thataicollection.com using Playwright
 * Strategy: collect all tag pages → extract all app slugs → get details + Korean descriptions
 *
 * Run: node scripts/scrape-playwright.js [--limit N] [--dry-run] [--skip-collection]
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
const LIMIT = args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1]) : 5000;
const DRY_RUN = args.includes('--dry-run');
const SKIP_COLLECTION = args.includes('--skip-collection');
const SLUGS_CACHE = path.join(__dirname, 'slugs-cache.json');

const SKIP_DOMAINS = new Set([
  'thataicollection.com', 'github.com', 'facebook.com', 'instagram.com',
  'linkedin.com', 'twitter.com', 'x.com', 'youtube.com', 'discord.com',
  'discord.gg', 'tiktok.com', 'reddit.com', 'medium.com', 'producthunt.com',
  'apple.com', 'play.google.com', 'apps.apple.com',
]);

const CATEGORY_MAP = {
  'art-and-image-generator': 'image-generation',
  'photo-and-image-editing': 'image-generation',
  'animation-and-3d-modeling': 'image-generation',
  'avatars': 'image-generation',
  'logo-generator': 'design',
  'web-design': 'design',
  'slides-and-presentations': 'design',
  'fashion': 'design',
  'architecture-and-interior-design': 'design',
  'code-and-database-assistant': 'coding',
  'video-generation-and-editing': 'video',
  'music-and-audio-generation': 'music',
  'speech': 'music',
  'text-to-speech': 'music',
  'writing-assistant': 'writing',
  'content-generation-and-seo': 'writing',
  'text': 'writing',
  'translation-and-transcript': 'writing',
  'email-assistant': 'writing',
  'education-and-learning': 'education',
  'chat-bot': 'chatbot',
  'gaming': 'game-dev',
  'sales-and-marketing': 'business',
  'productivity-and-personal-growth': 'business',
  'organization-and-automation': 'business',
  'research-assistant': 'business',
  'customer-support': 'business',
  'human-resources-and-resume': 'business',
  'accounting-and-finance': 'business',
  'ecommerce': 'business',
  'search-engines': 'business',
  'meeting-assistant': 'business',
  'social-networks-and-dating': 'chatbot',
  'fun': 'chatbot',
  'nsfw-nudify-and-ai-girlfriends': 'chatbot',
  'gift-ideas': 'business',
  'idea-generation': 'chatbot',
  'vacation-and-trip-planner': 'business',
  'reviews-and-recommendations': 'business',
  'plugins-and-extensions': 'business',
  'creators-toolkit': 'business',
  'healthcare': 'business',
  'legal': 'business',
};

async function collectAllSlugs(browser) {
  const page = await browser.newPage();
  await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });

  console.log('Step 1: Getting all category slugs...');
  await page.goto('https://thataicollection.com/en/categories/', { waitUntil: 'networkidle' });
  const categoryHrefs = await page.$$eval('a[href*="/en/categories/"]', els =>
    [...new Set(els.map(el => el.getAttribute('href')))]
      .filter(h => h && !h.endsWith('/categories/') && !h.includes('/tags/'))
  );
  const categories = categoryHrefs.map(h => ({
    slug: h.replace('/en/categories/', '').replace(/\/$/, ''),
    href: h,
  })).filter(c => c.slug && !c.slug.includes('/'));
  console.log(`Found ${categories.length} categories`);

  console.log('\nStep 2: Getting all tag URLs from each category...');
  const allTagUrls = new Set();
  const categorySlugMap = {};

  for (const cat of categories) {
    try {
      await page.goto(`https://thataicollection.com${cat.href}`, { waitUntil: 'networkidle', timeout: 20000 });
      const tagHrefs = await page.$$eval('a', els =>
        els.map(el => el.getAttribute('href')).filter(h => h && h.includes('/tags/'))
      );
      tagHrefs.forEach(t => {
        allTagUrls.add(t);
        categorySlugMap[t] = cat.slug;
      });
      process.stdout.write(`  ${cat.slug}: ${tagHrefs.length} tags (total: ${allTagUrls.size})\n`);
    } catch (e) {
      console.log(`  ${cat.slug}: ERROR ${e.message.slice(0, 40)}`);
    }
    await page.waitForTimeout(300);
  }

  console.log(`\nTotal unique tag URLs: ${allTagUrls.size}`);

  console.log('\nStep 3: Collecting app slugs from each tag page...');
  const allApps = new Map(); // slug -> { slug, category, categorySlug }

  for (const tagUrl of allTagUrls) {
    try {
      await page.goto(`https://thataicollection.com${tagUrl}`, { waitUntil: 'networkidle', timeout: 20000 });
      const appHrefs = await page.$$eval('a[href*="/en/application/"]', els =>
        [...new Set(els.map(el => el.getAttribute('href')))]
      );

      const catSlug = categorySlugMap[tagUrl] || 'other';
      let newCount = 0;
      for (const href of appHrefs) {
        const slug = href.replace('/en/application/', '').replace(/\/$/, '').split('?')[0];
        if (slug && !allApps.has(slug)) {
          allApps.set(slug, { slug, category: CATEGORY_MAP[catSlug] ?? 'business', categorySlug: catSlug });
          newCount++;
        }
      }
      process.stdout.write(`  ${tagUrl.split('/tags/')[1]}: ${appHrefs.length} apps (${newCount} new) total: ${allApps.size}\n`);
    } catch (e) {
      console.log(`  ERROR ${tagUrl}: ${e.message.slice(0, 40)}`);
    }
    await page.waitForTimeout(300);
  }

  // Also add apps from category pages themselves
  for (const cat of categories) {
    try {
      await page.goto(`https://thataicollection.com${cat.href}`, { waitUntil: 'networkidle', timeout: 20000 });
      const appHrefs = await page.$$eval('a[href*="/en/application/"]', els =>
        [...new Set(els.map(el => el.getAttribute('href')))]
      );
      appHrefs.forEach(href => {
        const slug = href.replace('/en/application/', '').replace(/\/$/, '').split('?')[0];
        if (slug && !allApps.has(slug)) {
          allApps.set(slug, { slug, category: CATEGORY_MAP[cat.slug] ?? 'business', categorySlug: cat.slug });
        }
      });
    } catch {}
  }

  await page.close();

  const result = [...allApps.values()];
  fs.writeFileSync(SLUGS_CACHE, JSON.stringify(result, null, 2));
  console.log(`\nSaved ${result.length} unique slugs to cache`);
  return result;
}

async function getServiceDetails(page, slug) {
  await page.goto(`https://thataicollection.com/en/application/${slug}`, {
    waitUntil: 'domcontentloaded', timeout: 20000,
  });

  const name = await page.$eval('h1', el => el.textContent.trim()).catch(() => '');
  const description = await page.$eval('meta[name="description"]', el => el.content).catch(() => '');

  const externalLinks = await page.$$eval('a[href^="http"]', els => els.map(el => el.href));
  const websiteUrl = externalLinks.find(url => {
    try {
      const hostname = new URL(url).hostname.replace('www.', '');
      return !Array.from(global.SKIP_DOMAINS).some(d => hostname.includes(d));
    } catch { return false; }
  });

  let cleanUrl = websiteUrl;
  if (cleanUrl) {
    try {
      const u = new URL(cleanUrl);
      ['linkId', 'sourceId', 'tenantId', 'utm_source', 'utm_medium', 'utm_campaign',
        'ref', 'via', 'aff', 'partner', 'fpr', 'gr_pk', 'gr_uid'].forEach(p => u.searchParams.delete(p));
      cleanUrl = u.toString().replace(/\?$/, '');
    } catch {}
  }

  return { name: name || slug, description, websiteUrl: cleanUrl };
}

async function generateKoreanInfo(name, description, categorySlug) {
  const prompt = `Describe AI service "${name}" for Korean users.
Description: ${(description || 'AI tool').slice(0, 200)}
Category: ${categorySlug}

Return JSON only:
{"tagline":"Korean 1 sentence max 80 chars","target_user":"Korean 1 sentence","key_features":"Korean 2-3 features comma separated","limitations":"Korean 1 sentence","skill_level":"beginner|intermediate|advanced|any","tags":["3-5 from: no-code,beginner,developer,web,mobile,api,free,korean,realtime,open-source,photo-editing,character,webtoon,story,translation,summarization,code-generation,tts"]}`;

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 350,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  return JSON.parse(text);
}

async function main() {
  global.SKIP_DOMAINS = SKIP_DOMAINS;

  await db.connect();
  console.log('Connected to database\n');

  const { rows: categories } = await db.query('SELECT id, slug FROM categories');
  const categoryMap = Object.fromEntries(categories.map(c => [c.slug, c.id]));
  const { rows: tags } = await db.query('SELECT id, slug FROM tags');
  const tagMap = Object.fromEntries(tags.map(t => [t.slug, t.id]));
  const { rows: existing } = await db.query('SELECT slug FROM ai_services');
  const existingSlugs = new Set(existing.map(r => r.slug));
  console.log(`Existing: ${existingSlugs.size} services`);

  // Phase 1: Collect slugs
  let allApps;
  if (SKIP_COLLECTION && fs.existsSync(SLUGS_CACHE)) {
    allApps = JSON.parse(fs.readFileSync(SLUGS_CACHE, 'utf8'));
    console.log(`Loaded ${allApps.length} slugs from cache`);
  } else {
    const browser = await chromium.launch({ headless: true });
    try {
      allApps = await collectAllSlugs(browser);
    } finally {
      await browser.close();
    }
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
    console.log('DRY RUN:');
    toProcess.slice(0, 15).forEach(a => console.log(`  ${a.slug} | ${a.category}`));
    await db.end();
    return;
  }

  // Phase 2: Get details + generate Korean + insert
  const browser2 = await chromium.launch({ headless: true });
  const page = await browser2.newPage();
  await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });

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
         categoryId, details.websiteUrl, 'freemium', info.skill_level, ['web'],
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

      if ((i + 1) % 50 === 0) {
        console.log(`\n--- [${i + 1}/${toProcess.length}] inserted=${inserted} skipped=${skipped} errors=${errors} ---\n`);
      }
    } catch (err) {
      errors++;
      console.log(` ✗ ${err.message.slice(0, 50)}`);
    }
  }

  await page.close();
  await browser2.close();

  console.log(`\n=== DONE ===`);
  console.log(`inserted=${inserted}, skipped=${skipped}, errors=${errors}`);
  console.log(`Total in DB: ~${existingSlugs.size + inserted}`);
  await db.end();
}

main().catch(err => { console.error(err); process.exit(1); });
