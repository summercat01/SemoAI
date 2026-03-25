/**
 * Scrapes all AI tools from thataicollection.com by category pages,
 * fetches actual URLs from each service page, generates Korean descriptions,
 * and seeds the database.
 *
 * Run: node scripts/scrape-full.js [--limit N] [--dry-run]
 */

const { Client } = require('pg');
const Anthropic = require('@anthropic-ai/sdk').default;
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const db = new Client({ connectionString: process.env.DATABASE_URL });

const args = process.argv.slice(2);
const LIMIT = args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1]) : 2000;
const DRY_RUN = args.includes('--dry-run');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

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
  'gift-ideas': 'business',
  'idea-generation': 'chatbot',
  'vacation-and-trip-planner': 'business',
  'reviews-and-recommendations': 'business',
  'plugins-and-extensions': 'business',
  'creators-toolkit': 'business',
  'healthcare': 'business',
  'legal': 'business',
  'architecture-and-interior-design': 'design',
  'nsfw-nudify-and-ai-girlfriends': 'chatbot',
  'other': 'business',
};

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA },
    signal: AbortSignal.timeout(12000),
  });
  return res.text();
}

async function getAllCategories() {
  const html = await fetchHtml('https://thataicollection.com/en/categories/');
  const cats = [...new Set([...html.matchAll(/href="\/en\/categories\/([^"?#\/]+)/g)].map(m => m[1]))];
  return cats;
}

async function getAppsFromCategory(categorySlug) {
  const html = await fetchHtml(`https://thataicollection.com/en/categories/${categorySlug}`);
  const apps = [...new Set([...html.matchAll(/href="\/en\/application\/([^"?#]+)"/g)].map(m => m[1]))];
  return apps.map(slug => ({ slug, category: CATEGORY_MAP[categorySlug] ?? 'business', categorySlug }));
}

async function getServiceDetails(slug) {
  const html = await fetchHtml(`https://thataicollection.com/en/application/${slug}`);

  // Get name from title or h1
  const nameMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/) || html.match(/<title>([^<|]+)/);
  const name = nameMatch ? nameMatch[1].trim().split('|')[0].trim() : slug;

  // Get description from meta or first paragraph
  const descMatch = html.match(/<meta name="description" content="([^"]+)"/) ||
                    html.match(/<p[^>]*>([^<]{50,})<\/p>/);
  const description = descMatch ? descMatch[1].trim() : '';

  // Get all external links, skip social/collection sites
  const links = [...html.matchAll(/href="(https?:\/\/[^"]+)"/g)]
    .map(m => m[1])
    .filter(url => {
      try {
        const hostname = new URL(url).hostname.replace('www.', '');
        return !SKIP_DOMAINS.has(hostname) && !Array.from(SKIP_DOMAINS).some(d => hostname.endsWith('.' + d));
      } catch { return false; }
    });

  // Clean and find best URL
  let websiteUrl = null;
  if (links.length > 0) {
    const slugWords = slug.replace(/-/g, ' ').split(' ').filter(w => w.length > 3);
    const preferred = links.find(l => slugWords.some(w => l.toLowerCase().includes(w)));
    const raw = preferred || links[0];
    try {
      const u = new URL(raw);
      ['linkId', 'sourceId', 'tenantId', 'utm_source', 'utm_medium', 'utm_campaign', 'ref', 'via', 'aff', 'partner', 'fpr'].forEach(p => u.searchParams.delete(p));
      // Remove amp-encoded params
      websiteUrl = u.toString().replace(/\?$/, '');
    } catch { websiteUrl = raw; }
  }

  return { name: name || slug, description, websiteUrl };
}

async function generateKoreanInfo(name, description, categorySlug) {
  const prompt = `You are describing an AI service for Korean users. Generate information about "${name}".
Description: ${description || 'An AI service.'}
Category: ${categorySlug}

Return JSON only (no markdown):
{
  "tagline": "one sentence max 80 chars in Korean",
  "target_user": "who should use this in Korean, 1 sentence",
  "key_features": "2-3 main features in Korean, comma separated",
  "limitations": "main limitation in Korean, 1 sentence",
  "skill_level": "beginner|intermediate|advanced|any",
  "tags": ["3-5 slugs from: no-code,beginner,developer,web,mobile,api,free,korean,realtime,open-source,photo-editing,character,webtoon,story,translation,summarization,code-generation,tts"]
}`;

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 350,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  return JSON.parse(text);
}

async function main() {
  await db.connect();
  console.log('Connected to database');

  const { rows: categories } = await db.query('SELECT id, slug FROM categories');
  const categoryMap = Object.fromEntries(categories.map(c => [c.slug, c.id]));
  const { rows: tags } = await db.query('SELECT id, slug FROM tags');
  const tagMap = Object.fromEntries(tags.map(t => [t.slug, t.id]));
  const { rows: existing } = await db.query('SELECT slug FROM ai_services');
  const existingSlugs = new Set(existing.map(r => r.slug));

  console.log(`Existing services: ${existingSlugs.size}`);

  // Step 1: Get all category slugs
  console.log('\nFetching categories...');
  const categoryList = await getAllCategories();
  console.log(`Found ${categoryList.length} categories: ${categoryList.join(', ')}`);

  // Step 2: Get all app slugs from all categories
  console.log('\nFetching app slugs from each category...');
  const allApps = [];
  const seenSlugs = new Set();

  for (const catSlug of categoryList) {
    try {
      const apps = await getAppsFromCategory(catSlug);
      const newApps = apps.filter(a => !seenSlugs.has(a.slug));
      newApps.forEach(a => seenSlugs.add(a.slug));
      allApps.push(...newApps);
      process.stdout.write(`  ${catSlug}: ${apps.length} (${newApps.length} new)\n`);
      await new Promise(r => setTimeout(r, 500));
    } catch (e) {
      console.log(`  ${catSlug}: ERROR ${e.message}`);
    }
  }

  console.log(`\nTotal unique apps found: ${allApps.length}`);

  // Filter out already existing
  const toProcess = allApps.filter(a => {
    const dbSlug = a.slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return !existingSlugs.has(dbSlug);
  }).slice(0, LIMIT);

  console.log(`To process: ${toProcess.length} (limit: ${LIMIT})`);

  if (DRY_RUN) {
    console.log('\nFirst 10:');
    toProcess.slice(0, 10).forEach(a => console.log(`  ${a.slug} | ${a.category}`));
    await db.end();
    return;
  }

  // Step 3: Process each app
  let inserted = 0, skipped = 0, errors = 0;

  for (let i = 0; i < toProcess.length; i++) {
    const app = toProcess[i];
    const dbSlug = app.slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    process.stdout.write(`[${i + 1}/${toProcess.length}] ${app.slug}...`);

    try {
      // Get service details
      const details = await getServiceDetails(app.slug);
      if (!details.websiteUrl) { skipped++; console.log(' ✗ (no URL)'); continue; }

      // Generate Korean info
      const info = await generateKoreanInfo(details.name, details.description, app.categorySlug);

      const categoryId = categoryMap[app.category] ?? categoryMap['business'];
      const { rows } = await db.query(
        `INSERT INTO ai_services (name, slug, tagline, description, category_id, website_url, pricing_type, skill_level, platforms, target_user, key_features, limitations)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (slug) DO NOTHING
         RETURNING id`,
        [details.name, dbSlug, info.tagline, details.description || info.tagline,
         categoryId, details.websiteUrl, 'freemium', info.skill_level, ['web'],
         info.target_user, info.key_features, info.limitations]
      );

      if (rows.length > 0) {
        const serviceId = rows[0].id;
        for (const tagSlug of (info.tags || [])) {
          const tagId = tagMap[tagSlug];
          if (tagId) await db.query(
            `INSERT INTO ai_service_tags (ai_service_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [serviceId, tagId]
          );
        }
        inserted++;
        console.log(` ✓ ${details.name}`);
      } else {
        skipped++;
        console.log(' (dup)');
      }

      await new Promise(r => setTimeout(r, 400));
    } catch (err) {
      errors++;
      console.log(` ✗ ${err.message.slice(0, 60)}`);
    }
  }

  console.log(`\nDone! inserted=${inserted}, skipped=${skipped}, errors=${errors}`);
  console.log(`Total in DB: ${existingSlugs.size + inserted}`);
  await db.end();
}

main().catch(err => { console.error(err); process.exit(1); });
