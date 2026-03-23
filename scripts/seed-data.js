const { Client } = require('pg');
const Anthropic = require('@anthropic-ai/sdk').default;
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const db = new Client({ connectionString: process.env.DATABASE_URL });

// Well-known AI services to seed
const AI_SERVICES = [
  // Image Generation
  { name: 'Midjourney', category: 'image-generation', website: 'https://midjourney.com', pricing: 'paid', platforms: ['web'] },
  { name: 'DALL·E 3', category: 'image-generation', website: 'https://openai.com/dall-e-3', pricing: 'freemium', platforms: ['web', 'api'] },
  { name: 'Stable Diffusion', category: 'image-generation', website: 'https://stability.ai', pricing: 'open-source', platforms: ['web', 'desktop', 'api'] },
  { name: 'Adobe Firefly', category: 'image-generation', website: 'https://firefly.adobe.com', pricing: 'freemium', platforms: ['web'] },
  { name: 'Leonardo AI', category: 'image-generation', website: 'https://leonardo.ai', pricing: 'freemium', platforms: ['web'] },
  { name: 'Ideogram', category: 'image-generation', website: 'https://ideogram.ai', pricing: 'freemium', platforms: ['web'] },
  { name: 'Flux', category: 'image-generation', website: 'https://blackforestlabs.ai', pricing: 'freemium', platforms: ['api'] },
  // Coding
  { name: 'GitHub Copilot', category: 'coding', website: 'https://github.com/copilot', pricing: 'paid', platforms: ['desktop', 'web'] },
  { name: 'Cursor', category: 'coding', website: 'https://cursor.sh', pricing: 'freemium', platforms: ['desktop'] },
  { name: 'Replit AI', category: 'coding', website: 'https://replit.com', pricing: 'freemium', platforms: ['web'] },
  { name: 'v0 by Vercel', category: 'coding', website: 'https://v0.dev', pricing: 'freemium', platforms: ['web'] },
  { name: 'Bolt.new', category: 'coding', website: 'https://bolt.new', pricing: 'freemium', platforms: ['web'] },
  { name: 'Lovable', category: 'coding', website: 'https://lovable.dev', pricing: 'freemium', platforms: ['web'] },
  { name: 'Windsurf', category: 'coding', website: 'https://codeium.com/windsurf', pricing: 'freemium', platforms: ['desktop'] },
  // Game Dev
  { name: 'GDevelop', category: 'game-dev', website: 'https://gdevelop.io', pricing: 'freemium', platforms: ['web', 'desktop'] },
  { name: 'Unity AI', category: 'game-dev', website: 'https://unity.com', pricing: 'freemium', platforms: ['desktop'] },
  { name: 'Rosebud AI', category: 'game-dev', website: 'https://rosebud.ai', pricing: 'freemium', platforms: ['web'] },
  { name: 'Scenario', category: 'game-dev', website: 'https://scenario.com', pricing: 'freemium', platforms: ['web'] },
  { name: 'Suno', category: 'music', website: 'https://suno.com', pricing: 'freemium', platforms: ['web'] },
  { name: 'Meshy', category: 'game-dev', website: 'https://meshy.ai', pricing: 'freemium', platforms: ['web'] },
  // Video
  { name: 'Runway', category: 'video', website: 'https://runwayml.com', pricing: 'freemium', platforms: ['web'] },
  { name: 'Sora', category: 'video', website: 'https://sora.com', pricing: 'paid', platforms: ['web'] },
  { name: 'Kling AI', category: 'video', website: 'https://klingai.com', pricing: 'freemium', platforms: ['web'] },
  { name: 'HeyGen', category: 'video', website: 'https://heygen.com', pricing: 'freemium', platforms: ['web'] },
  { name: 'Pika', category: 'video', website: 'https://pika.art', pricing: 'freemium', platforms: ['web'] },
  // Writing
  { name: 'ChatGPT', category: 'writing', website: 'https://chat.openai.com', pricing: 'freemium', platforms: ['web', 'mobile', 'api'] },
  { name: 'Claude', category: 'chatbot', website: 'https://claude.ai', pricing: 'freemium', platforms: ['web', 'api'] },
  { name: 'Jasper', category: 'writing', website: 'https://jasper.ai', pricing: 'paid', platforms: ['web'] },
  { name: 'Copy.ai', category: 'writing', website: 'https://copy.ai', pricing: 'freemium', platforms: ['web'] },
  { name: 'Notion AI', category: 'writing', website: 'https://notion.so', pricing: 'paid', platforms: ['web', 'desktop', 'mobile'] },
  // Music
  { name: 'Udio', category: 'music', website: 'https://udio.com', pricing: 'freemium', platforms: ['web'] },
  { name: 'ElevenLabs', category: 'music', website: 'https://elevenlabs.io', pricing: 'freemium', platforms: ['web', 'api'] },
  // Design
  { name: 'Canva AI', category: 'design', website: 'https://canva.com', pricing: 'freemium', platforms: ['web', 'mobile'] },
  { name: 'Figma AI', category: 'design', website: 'https://figma.com', pricing: 'freemium', platforms: ['web', 'desktop'] },
  { name: 'Looka', category: 'design', website: 'https://looka.com', pricing: 'paid', platforms: ['web'] },
  // Business
  { name: 'Perplexity', category: 'business', website: 'https://perplexity.ai', pricing: 'freemium', platforms: ['web', 'mobile'] },
  { name: 'Make', category: 'business', website: 'https://make.com', pricing: 'freemium', platforms: ['web'] },
  { name: 'Zapier AI', category: 'business', website: 'https://zapier.com', pricing: 'freemium', platforms: ['web'] },
  // Education
  { name: 'Khan Academy Khanmigo', category: 'education', website: 'https://khanacademy.org', pricing: 'free', platforms: ['web'] },
  { name: 'Duolingo AI', category: 'education', website: 'https://duolingo.com', pricing: 'freemium', platforms: ['mobile', 'web'] },
  // Webtoon/Comic
  { name: 'Webtoon Canvas AI', category: 'image-generation', website: 'https://canvas.webtoons.com', pricing: 'free', platforms: ['web'] },
  { name: 'Clip Studio Paint AI', category: 'design', website: 'https://clipstudio.net', pricing: 'paid', platforms: ['desktop', 'mobile'] },
  { name: 'Novel AI', category: 'writing', website: 'https://novelai.net', pricing: 'paid', platforms: ['web'] },
  // Chatbot
  { name: 'Gemini', category: 'chatbot', website: 'https://gemini.google.com', pricing: 'freemium', platforms: ['web', 'mobile', 'api'] },
  { name: 'Microsoft Copilot', category: 'chatbot', website: 'https://copilot.microsoft.com', pricing: 'freemium', platforms: ['web', 'mobile'] },
  { name: 'Poe', category: 'chatbot', website: 'https://poe.com', pricing: 'freemium', platforms: ['web', 'mobile'] },
  // Misc
  { name: 'Remove.bg', category: 'image-generation', website: 'https://remove.bg', pricing: 'freemium', platforms: ['web', 'api'] },
  { name: 'Luma AI', category: 'video', website: 'https://lumalabs.ai', pricing: 'freemium', platforms: ['web', 'mobile'] },
  { name: 'Whisper', category: 'music', website: 'https://openai.com/research/whisper', pricing: 'open-source', platforms: ['api'] },
  { name: 'D-ID', category: 'video', website: 'https://d-id.com', pricing: 'freemium', platforms: ['web', 'api'] },
];

async function generateServiceInfo(service) {
  const prompt = `You are describing an AI service for Korean users. Generate information about "${service.name}" in Korean.

Return a JSON object with these exact fields:
- tagline: one sentence (max 80 chars) in Korean describing what it does
- description: 2-3 sentences in Korean describing the service
- target_user: who should use this (in Korean, 1 sentence)
- key_features: 2-3 main features (in Korean, comma separated)
- limitations: main limitation or downside (in Korean, 1 sentence)
- skill_level: one of "beginner", "intermediate", "advanced", "any"
- tags: array of 3-6 relevant slugs from this list: no-code, beginner, developer, web, mobile, api, free, korean, realtime, open-source, local, photo-editing, character, background, 2d-game, 3d-game, rpg, roguelike, webtoon, comic, story, translation, summarization, code-generation, tts

Return only the JSON object, no markdown.`;

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 500,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  return JSON.parse(text);
}

async function main() {
  await db.connect();
  console.log('Connected to database');

  // Get category IDs
  const { rows: categories } = await db.query('SELECT id, slug FROM categories');
  const categoryMap = Object.fromEntries(categories.map(c => [c.slug, c.id]));

  // Get tag IDs
  const { rows: tags } = await db.query('SELECT id, slug FROM tags');
  const tagMap = Object.fromEntries(tags.map(t => [t.slug, t.id]));

  let count = 0;
  for (const service of AI_SERVICES) {
    try {
      process.stdout.write(`Processing ${service.name}...`);
      const info = await generateServiceInfo(service);

      const slug = service.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const categoryId = categoryMap[service.category];

      const { rows } = await db.query(
        `INSERT INTO ai_services (name, slug, tagline, description, category_id, website_url, pricing_type, skill_level, platforms, target_user, key_features, limitations)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (slug) DO UPDATE SET
           tagline = EXCLUDED.tagline,
           description = EXCLUDED.description,
           updated_at = NOW()
         RETURNING id`,
        [service.name, slug, info.tagline, info.description, categoryId, service.website,
         service.pricing, info.skill_level, service.platforms,
         info.target_user, info.key_features, info.limitations]
      );

      const serviceId = rows[0].id;

      // Insert tags
      if (info.tags && info.tags.length > 0) {
        for (const tagSlug of info.tags) {
          const tagId = tagMap[tagSlug];
          if (tagId) {
            await db.query(
              `INSERT INTO ai_service_tags (ai_service_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
              [serviceId, tagId]
            );
          }
        }
      }

      count++;
      console.log(` ✓ (${count}/${AI_SERVICES.length})`);

      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 300));
    } catch (err) {
      console.log(` ✗ Error: ${err.message}`);
    }
  }

  console.log(`\nDone! Seeded ${count} AI services.`);
  await db.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
