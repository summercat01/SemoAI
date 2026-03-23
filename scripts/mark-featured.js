require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });
const { Client } = require('pg');
const db = new Client({ connectionString: process.env.DATABASE_URL });

const FEATURED = [
  'ChatGPT', 'Claude', 'Gemini', 'Midjourney', 'DALL·E 3', 'Stable Diffusion',
  'GitHub Copilot', 'Cursor', 'Runway', 'Sora', 'ElevenLabs', 'Suno', 'Udio',
  'Perplexity', 'Canva AI', 'Figma AI', 'Adobe Firefly', 'HeyGen', 'Pika',
  'Notion AI', 'Jasper', 'Copy.ai', 'Microsoft Copilot', 'Kling AI', 'Replit AI',
  'v0 by Vercel', 'Bolt.new', 'Lovable', 'Windsurf', 'Leonardo AI', 'Ideogram',
  'Luma AI', 'D-ID', 'Remove.bg', 'Duolingo AI', 'Poe', 'Chatbase', 'Taskade',
  'Rytr', 'GDevelop', 'Rosebud AI', 'Scenario', 'Unity AI', 'Looka',
  'Webtoon Canvas AI', 'Novel AI', 'Flux', 'Whisper', 'Khan Academy Khanmigo',
];

async function main() {
  await db.connect();
  await db.query('ALTER TABLE ai_services ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false');
  const result = await db.query(
    `UPDATE ai_services SET is_featured = true WHERE name = ANY($1::text[])`,
    [FEATURED]
  );
  console.log(`Marked ${result.rowCount} services as featured`);

  // Show which ones were found
  const { rows } = await db.query(
    `SELECT name FROM ai_services WHERE is_featured = true ORDER BY name`
  );
  console.log('Featured:', rows.map(r => r.name).join(', '));
  await db.end();
}

main().catch(e => { console.error(e); process.exit(1); });
