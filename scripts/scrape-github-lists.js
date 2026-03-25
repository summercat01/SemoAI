/**
 * Scrapes AI tools from multiple GitHub awesome-ai repositories
 * and seeds them into the database.
 *
 * Sources:
 * - mahseema/awesome-ai-tools
 * - steven2358/awesome-generative-ai
 * - e2b-dev/awesome-ai-agents
 * - sindresorhus/awesome (AI section)
 *
 * Run: node scripts/scrape-github-lists.js [--dry-run]
 */

const { Client } = require('pg');
const Anthropic = require('@anthropic-ai/sdk').default;
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const db = new Client({ connectionString: process.env.DATABASE_URL });
const DRY_RUN = process.argv.includes('--dry-run');

const SOURCES = [
  {
    url: 'https://raw.githubusercontent.com/mahseema/awesome-ai-tools/main/README.md',
    name: 'mahseema/awesome-ai-tools',
  },
  {
    url: 'https://raw.githubusercontent.com/steven2358/awesome-generative-ai/main/README.md',
    name: 'steven2358/awesome-generative-ai',
  },
  {
    url: 'https://raw.githubusercontent.com/e2b-dev/awesome-ai-agents/main/README.md',
    name: 'e2b-dev/awesome-ai-agents',
  },
  {
    url: 'https://raw.githubusercontent.com/humanloop/awesome-chatgpt/main/README.md',
    name: 'humanloop/awesome-chatgpt',
  },
  {
    url: 'https://raw.githubusercontent.com/aimerou/awesome-ai-papers/main/README.md',
    name: 'aimerou/awesome-ai-papers',
  },
];

const SKIP_DOMAINS = new Set([
  'github.com', 'arxiv.org', 'shields.io', 'awesome.re', 'twitter.com', 'x.com',
  'youtube.com', 'medium.com', 'producthunt.com', 'reddit.com', 'discord.com',
  'docs.', 'huggingface.co',
]);

const CATEGORY_KEYWORDS = {
  'image-generation': ['image', 'photo', 'art', 'picture', 'visual', 'diffusion', 'stable diffusion', 'midjourney', 'dall'],
  'video': ['video', 'film', 'movie', 'animation', 'motion'],
  'music': ['music', 'audio', 'sound', 'voice', 'speech', 'tts', 'song'],
  'coding': ['code', 'coding', 'developer', 'programming', 'software', 'sql', 'github'],
  'writing': ['writing', 'text', 'content', 'copy', 'essay', 'translate', 'grammar', 'seo'],
  'education': ['education', 'learn', 'study', 'tutor', 'course', 'school', 'quiz'],
  'chatbot': ['chat', 'chatbot', 'assistant', 'llm', 'gpt', 'conversation'],
  'design': ['design', 'ui', 'ux', 'logo', 'presentation', 'slides'],
  'business': ['business', 'productivity', 'marketing', 'sales', 'analytics', 'automation', 'workflow'],
  'game-dev': ['game', 'gaming'],
};

function mapCategory(text) {
  const lower = text.toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(k => lower.includes(k))) return cat;
  }
  return 'business';
}

function isValidToolUrl(url) {
  try {
    const hostname = new URL(url).hostname.replace('www.', '');
    return !Array.from(SKIP_DOMAINS).some(d => hostname.startsWith(d) || hostname.includes(d));
  } catch { return false; }
}

async function parseRepo(url, sourceName) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) { console.log(`  ${sourceName}: HTTP ${res.status}`); return []; }
    const text = await res.text();
    const lines = text.split('\n');
    const services = [];
    let currentSection = '';

    for (const line of lines) {
      const sectionMatch = line.match(/^#{1,3}\s+(.+)/);
      if (sectionMatch) currentSection = sectionMatch[1].replace(/[^\w\s]/g, '').trim();

      // Match: - [Name](URL) - description  OR  * [Name](URL) description
      const serviceMatch = line.match(/^[-*]\s+\[([^\]]{2,60})\]\((https?:\/\/[^)]+)\)\s*[-–—:]?\s*(.*)/);
      if (serviceMatch) {
        const [, name, url, desc] = serviceMatch;
        if (isValidToolUrl(url) && name.length > 1) {
          services.push({
            name: name.trim(),
            url: url.trim(),
            description: desc.trim().replace(/^[-–—:]\s*/, ''),
            section: currentSection,
            category: mapCategory(currentSection + ' ' + desc),
          });
        }
      }
    }
    return services;
  } catch (e) {
    console.log(`  ${sourceName}: ERROR ${e.message}`);
    return [];
  }
}

async function generateKoreanInfo(name, description, category) {
  const prompt = `Describe AI service/tool "${name}" for Korean users.
Description: ${(description || 'An AI tool.').slice(0, 200)}
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

  // Collect from all sources
  console.log('Fetching from GitHub repos...');
  const allServices = [];
  const seenDomains = new Set();

  for (const source of SOURCES) {
    const services = await parseRepo(source.url, source.name);
    let newCount = 0;
    for (const s of services) {
      try {
        const domain = new URL(s.url).hostname.replace('www.', '');
        if (!seenDomains.has(domain)) {
          seenDomains.add(domain);
          allServices.push(s);
          newCount++;
        }
      } catch {}
    }
    console.log(`  ${source.name}: ${services.length} found, ${newCount} unique`);
  }
  console.log(`\nTotal unique services: ${allServices.length}`);

  // Filter already in DB
  const toProcess = allServices.filter(s => {
    const slug = s.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return !existingSlugs.has(slug);
  });
  console.log(`New to process: ${toProcess.length}\n`);

  if (DRY_RUN) {
    console.log('DRY RUN - first 15:');
    toProcess.slice(0, 15).forEach(s => console.log(`  ${s.name} | ${s.category} | ${s.url}`));
    await db.end();
    return;
  }

  let inserted = 0, skipped = 0, errors = 0;

  for (let i = 0; i < toProcess.length; i++) {
    const s = toProcess[i];
    const slug = s.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    process.stdout.write(`[${i + 1}/${toProcess.length}] ${s.name}...`);

    try {
      const info = await generateKoreanInfo(s.name, s.description, s.category);
      const categoryId = categoryMap[s.category] ?? categoryMap['business'];

      const { rows } = await db.query(
        `INSERT INTO ai_services (name, slug, tagline, description, category_id, website_url, pricing_type, skill_level, platforms, target_user, key_features, limitations)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
         ON CONFLICT (slug) DO NOTHING RETURNING id`,
        [s.name, slug, info.tagline, s.description || info.tagline,
         categoryId, s.url, 'freemium', info.skill_level, ['web'],
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
        console.log(' ✓');
      } else {
        skipped++;
        console.log(' (dup)');
      }

      await new Promise(r => setTimeout(r, 200));
    } catch (err) {
      errors++;
      console.log(` ✗ ${err.message.slice(0, 50)}`);
    }
  }

  console.log(`\nDone! inserted=${inserted}, skipped=${skipped}, errors=${errors}`);
  await db.end();
}

main().catch(err => { console.error(err); process.exit(1); });
