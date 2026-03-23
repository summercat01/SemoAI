/**
 * Scrapes actual service URLs from thataicollection.com service pages
 * and updates the database.
 *
 * Run: node scripts/fix-redirect-urls.js
 */

const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const db = new Client({ connectionString: process.env.DATABASE_URL });

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// Domains to skip (not actual service URLs)
const SKIP_DOMAINS = ['thataicollection.com', 'github.com', 'facebook.com', 'instagram.com', 'linkedin.com', 'twitter.com', 'x.com', 'youtube.com', 'discord.com', 'discord.gg', 'tiktok.com', 'reddit.com', 'medium.com', 'producthunt.com'];

function isServiceUrl(url) {
  try {
    const hostname = new URL(url).hostname;
    return !SKIP_DOMAINS.some(d => hostname.includes(d));
  } catch { return false; }
}

function cleanUrl(url) {
  try {
    const u = new URL(url);
    // Remove tracking params
    ['linkId', 'sourceId', 'tenantId', 'utm_source', 'utm_medium', 'utm_campaign', 'ref', 'referral'].forEach(p => u.searchParams.delete(p));
    // Return just origin if path is just /
    return u.searchParams.size === 0 && u.pathname === '/' ? u.origin + '/' : u.toString();
  } catch { return url; }
}

async function fetchActualUrl(slug) {
  const pageUrl = `https://thataicollection.com/en/application/${slug}`;
  try {
    const res = await fetch(pageUrl, {
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(10000),
    });
    const html = await res.text();

    // Extract all external links
    const links = [...html.matchAll(/href="(https?:\/\/[^"]+)"/g)]
      .map(m => m[1])
      .filter(isServiceUrl);

    if (links.length === 0) return null;

    // Prefer links that look like main service domain (contain the slug words)
    const slugWords = slug.replace(/-/g, ' ').split(' ').filter(w => w.length > 3);
    const preferred = links.find(l => slugWords.some(w => l.toLowerCase().includes(w)));

    return cleanUrl(preferred || links[0]);
  } catch {
    return null;
  }
}

async function main() {
  await db.connect();
  console.log('Connected to database');

  const { rows } = await db.query(
    "SELECT id, name, website_url FROM ai_services WHERE website_url LIKE '%thataicollection.com/redirect%'"
  );
  console.log(`Found ${rows.length} redirect URLs to resolve\n`);

  let updated = 0, failed = 0;

  for (let i = 0; i < rows.length; i++) {
    const { id, name, website_url } = rows[i];
    const slug = website_url.replace('https://thataicollection.com/redirect/', '');

    process.stdout.write(`[${i + 1}/${rows.length}] ${name}...`);

    const actualUrl = await fetchActualUrl(slug);

    if (actualUrl) {
      await db.query('UPDATE ai_services SET website_url = $1 WHERE id = $2', [actualUrl, id]);
      updated++;
      console.log(` ✓ ${actualUrl}`);
    } else {
      failed++;
      console.log(' ✗');
    }

    await new Promise(r => setTimeout(r, 300));
  }

  console.log(`\nDone! updated=${updated}, failed=${failed}`);
  await db.end();
}

main().catch(err => { console.error(err); process.exit(1); });
