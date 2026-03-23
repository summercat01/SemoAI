/**
 * Scrapes AI tools from the ai-collection GitHub repo
 * and seeds them into the database with Korean descriptions via Claude.
 *
 * Run: node scripts/scrape-directory.js [--limit N] [--dry-run]
 */

const { Client } = require('pg');
const Anthropic = require('@anthropic-ai/sdk').default;
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const db = new Client({ connectionString: process.env.DATABASE_URL });

const args = process.argv.slice(2);
const LIMIT = args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1]) : 500;
const DRY_RUN = args.includes('--dry-run');

const CATEGORY_MAP = {
  'Art & Image Generator': 'image-generation',
  'Photo & Image Editing': 'image-generation',
  'Animation & 3D Modeling': 'image-generation',
  'Avatars': 'image-generation',
  'Code & Database Assistant': 'coding',
  'Web Design': 'coding',
  'Video Generation & Editing': 'video',
  'Music & Audio Generation': 'music',
  'Speech': 'music',
  'Text To Speech': 'music',
  'Writing Assistant': 'writing',
  'Content Generation & Seo': 'writing',
  'Text': 'writing',
  'Translation & Transcript': 'writing',
  'Email Assistant': 'writing',
  'Education & Learning': 'education',
  'Chat Bot': 'chatbot',
  'Gaming': 'game-dev',
  'Logo Generator': 'design',
  'Slides & Presentations': 'design',
  'Sales & Marketing': 'business',
  'Productivity & Personal Growth': 'business',
  'Organization & Automation': 'business',
  'Research Assistant': 'business',
  'Customer Support': 'business',
  'Human Resources & Resume': 'business',
  'Accounting & Finance': 'business',
  'Ecommerce': 'business',
  'Search Engines': 'business',
  'Architecture & Interior Design': 'design',
  'Fashion': 'design',
  'Healthcare': 'business',
  'Legal': 'business',
  'Creators Toolkit': 'business',
  'Meeting Assistant': 'business',
  'Social Networks & Dating': 'chatbot',
  'Fun': 'chatbot',
  'Gift Ideas': 'business',
  'Idea Generation': 'chatbot',
  'Vacation & Trip Planner': 'business',
  'Reviews & Recommendations': 'business',
  'Plugins & Extensions': 'business',
  'Latest Additions to AI Collection': 'business',
};

function mapCategory(sectionName) {
  return CATEGORY_MAP[sectionName] ?? 'business';
}

function parsePricing(description) {
  if (!description) return 'freemium';
  const t = description.toLowerCase();
  if (t.includes('open source') || t.includes('opensource')) return 'open-source';
  if (t.includes('free') && (t.includes('paid') || t.includes('premium') || t.includes('/month') || t.includes('plan'))) return 'freemium';
  if (t.includes('free trial') || t.includes('free tier') || t.includes('free plan')) return 'freemium';
  if (t.includes('free')) return 'free';
  if (t.includes('$') || t.includes('paid') || t.includes('subscription') || t.includes('pricing')) return 'paid';
  return 'freemium';
}

async function fetchAndParse() {
  console.log('Fetching ai-collection README...');
  const res = await fetch('https://raw.githubusercontent.com/ai-collection/ai-collection/main/README.md');
  const text = await res.text();
  console.log(`Fetched ${(text.length / 1024).toFixed(0)}KB`);

  const tools = [];
  let currentSection = 'Latest Additions to AI Collection';

  // Split into lines for section tracking, then re-join tool blocks
  const lines = text.split('\n');
  let toolBlock = null;

  for (const line of lines) {
    // Track ## category sections
    const sectionMatch = line.match(/^## (.+)/);
    if (sectionMatch) {
      currentSection = sectionMatch[1].trim().replace(/[^\w\s&]/g, '').trim();
      continue;
    }

    // New tool starts at ### heading
    const toolMatch = line.match(/^### (.+)/);
    if (toolMatch) {
      if (toolBlock) tools.push(toolBlock);
      toolBlock = {
        name: toolMatch[1].trim(),
        section: currentSection,
        url: '',
        tagline: '',
        description: '',
        lines: [],
      };
      continue;
    }

    if (toolBlock) {
      toolBlock.lines.push(line);
    }
  }
  if (toolBlock) tools.push(toolBlock);

  // Post-process each tool block
  for (const tool of tools) {
    const content = tool.lines.join('\n');

    // Extract URL from [Visit](https://thataicollection.com/redirect/slug?...)
    const visitMatch = content.match(/\[Visit\]\(https:\/\/thataicollection\.com\/redirect\/([^\)?]+)/);
    if (visitMatch) {
      tool.url = `https://thataicollection.com/redirect/${visitMatch[1]}`;
      tool.redirectSlug = visitMatch[1];
    }

    // Extract tagline from #### Name — Tagline
    const taglineMatch = content.match(/####[^—\n]+—\s*(.+)/);
    if (taglineMatch) tool.tagline = taglineMatch[1].trim().slice(0, 120);

    // Extract description: longest paragraph that's not a link
    const paragraphs = content.split('\n\n')
      .map(p => p.trim())
      .filter(p => p.length > 50 && !p.startsWith('[') && !p.startsWith('<') && !p.startsWith('#') && !p.startsWith('!'));
    tool.description = paragraphs[0] || tool.tagline;

    tool.category = mapCategory(tool.section);
    tool.pricing = parsePricing(tool.description);

    delete tool.lines;
  }

  return tools.filter(t => t.url && t.name);
}

async function generateKoreanInfo(tool) {
  const prompt = `You are describing an AI service for Korean users. Generate information about "${tool.name}".

English description: ${tool.description || tool.tagline}
Category: ${tool.section}

Return a JSON object with these exact fields:
- tagline: one sentence (max 80 chars) in Korean describing what it does
- target_user: who should use this (in Korean, 1 sentence)
- key_features: 2-3 main features (in Korean, comma separated)
- limitations: main limitation (in Korean, 1 sentence)
- skill_level: one of "beginner", "intermediate", "advanced", "any"
- tags: array of 3-5 slugs from: no-code, beginner, developer, web, mobile, api, free, korean, realtime, open-source, photo-editing, character, webtoon, story, translation, summarization, code-generation, tts

Return only the JSON object, no markdown.`;

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 400,
    messages: [{ role: 'user', content: prompt }],
  });

  const rawText = response.content[0].text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  return JSON.parse(rawText);
}

async function main() {
  await db.connect();
  console.log('Connected to database');

  const { rows: categories } = await db.query('SELECT id, slug FROM categories');
  const categoryMap = Object.fromEntries(categories.map(c => [c.slug, c.id]));
  const { rows: tags } = await db.query('SELECT id, slug FROM tags');
  const tagMap = Object.fromEntries(tags.map(t => [t.slug, t.id]));

  const allTools = await fetchAndParse();
  console.log(`Parsed ${allTools.length} tools total`);

  // Deduplicate by redirect slug
  const seen = new Set();
  const tools = [];
  for (const tool of allTools) {
    const key = tool.redirectSlug || tool.name;
    if (seen.has(key)) continue;
    seen.add(key);
    tools.push(tool);
    if (tools.length >= LIMIT) break;
  }
  console.log(`Processing ${tools.length} unique tools (limit: ${LIMIT})`);

  if (DRY_RUN) {
    console.log('\nFirst 15 parsed tools:');
    tools.slice(0, 15).forEach(t =>
      console.log(`  ${t.name.padEnd(30)} | ${t.category.padEnd(18)} | ${t.pricing.padEnd(10)} | ${(t.tagline || '').slice(0, 50)}`)
    );
    await db.end();
    return;
  }

  const { rows: existing } = await db.query('SELECT slug FROM ai_services');
  const existingSlugs = new Set(existing.map(r => r.slug));

  let inserted = 0, skipped = 0, errors = 0;

  for (let i = 0; i < tools.length; i++) {
    const tool = tools[i];
    const dbSlug = tool.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    if (existingSlugs.has(dbSlug)) { skipped++; continue; }

    try {
      process.stdout.write(`[${inserted + skipped + errors + 1}/${tools.length}] ${tool.name}...`);
      const info = await generateKoreanInfo(tool);

      const categoryId = categoryMap[tool.category] ?? categoryMap['business'];
      const { rows } = await db.query(
        `INSERT INTO ai_services (name, slug, tagline, description, category_id, website_url, pricing_type, skill_level, platforms, target_user, key_features, limitations)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (slug) DO NOTHING
         RETURNING id`,
        [tool.name, dbSlug, info.tagline, tool.description || tool.tagline, categoryId,
         tool.url, tool.pricing, info.skill_level, ['web'],
         info.target_user, info.key_features, info.limitations]
      );

      if (rows.length > 0) {
        const serviceId = rows[0].id;
        for (const tagSlug of (info.tags || [])) {
          const tagId = tagMap[tagSlug];
          if (tagId) {
            await db.query(
              `INSERT INTO ai_service_tags (ai_service_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
              [serviceId, tagId]
            );
          }
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
      console.log(` ✗ ${err.message}`);
    }
  }

  console.log(`\nDone! inserted=${inserted}, skipped=${skipped}, errors=${errors}`);
  await db.end();
}

main().catch(err => { console.error(err); process.exit(1); });
