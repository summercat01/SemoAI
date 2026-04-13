// Migrates data from Supabase → local server postgres via SSH tunnel
// Run: node scripts/migrate-to-local.mjs
import { createConnection } from 'net';
import pkg from '../node_modules/pg/lib/index.js';
const { Client } = pkg;
import { execSync } from 'child_process';
import fs from 'fs';

const SUPABASE_URL = {
  host: 'aws-1-ap-northeast-2.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.utlumkbdzqrgdquzuexz',
  password: 'hbkzQsOCdpsvnLYF',
  ssl: { rejectUnauthorized: false },
};

const TABLES = ['categories', 'tags', 'ai_services', 'ai_service_tags'];

async function main() {
  console.log('Connecting to Supabase...');
  const src = new Client(SUPABASE_URL);
  await src.connect();
  console.log('Connected to Supabase ✓');

  let sql = '';

  for (const table of TABLES) {
    console.log(`Exporting ${table}...`);
    const hasId = table !== 'ai_service_tags';
    const { rows, fields } = await src.query(`SELECT * FROM ${table}${hasId ? ' ORDER BY id' : ''}`);
    if (rows.length === 0) { console.log(`  (empty)`); continue; }

    const cols = fields.map(f => f.name).filter(c => c !== 'embedding'); // skip vector column
    sql += `\\echo 'Inserting ${table} (${rows.length} rows)';\n`;
    sql += `TRUNCATE ${table} RESTART IDENTITY CASCADE;\n`;

    for (const row of rows) {
      const vals = cols.map(c => {
        const v = row[c];
        if (v === null || v === undefined) return 'NULL';
        if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
        if (typeof v === 'number') return v;
        if (Array.isArray(v)) return `ARRAY[${v.map(x => `'${String(x).replace(/'/g, "''")}'`).join(',')}]`;
        if (v instanceof Date) return `'${v.toISOString()}'`;
        return `'${String(v).replace(/'/g, "''")}'`;
      });
      sql += `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${vals.join(', ')});\n`;
    }
    sql += `\n`;
    console.log(`  ${rows.length} rows`);
  }

  await src.end();

  // Write SQL to temp file (Windows-compatible path)
  const tmpFile = `${process.env.TEMP || process.env.TMP || '/tmp'}/semoai_migrate.sql`;
  fs.writeFileSync(tmpFile, sql);
  console.log(`\nSQL written to ${tmpFile}`);

  // SCP to server and execute
  console.log('Sending to server...');
  execSync(`scp -i /c/Users/jumok/.ssh/id_ed25519 ${tmpFile} ko@172.21.167.90:/tmp/semoai_migrate.sql`, { stdio: 'inherit' });

  console.log('Restoring on server...');
  execSync(`ssh -i /c/Users/jumok/.ssh/id_ed25519 ko@172.21.167.90 "docker cp /tmp/semoai_migrate.sql postgres:/tmp/ && docker exec postgres psql -U postgres -d semoai -f /tmp/semoai_migrate.sql"`, { stdio: 'inherit' });

  // Fix sequences
  execSync(`ssh -i /c/Users/jumok/.ssh/id_ed25519 ko@172.21.167.90 "docker exec postgres psql -U postgres -d semoai -c \\"SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories)); SELECT setval('ai_services_id_seq', (SELECT MAX(id) FROM ai_services)); SELECT setval('tags_id_seq', (SELECT MAX(id) FROM tags));\\""`, { stdio: 'inherit' });

  console.log('\nMigration complete! ✓');
}

main().catch(e => { console.error(e); process.exit(1); });
