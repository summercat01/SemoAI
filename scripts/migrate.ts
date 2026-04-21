/**
 * Lightweight SQL migration runner for SemoAI.
 *
 * Usage:
 *   npx tsx scripts/migrate.ts          — run pending migrations
 *   npx tsx scripts/migrate.ts status   — show migration status
 *   npx tsx scripts/migrate.ts create <name>  — create a new migration file
 *
 * Migration files live in /migrations and are named:
 *   0001_initial_schema.sql, 0002_add_index.sql, etc.
 *
 * Applied migrations are tracked in the `_migrations` table.
 */

import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations');

async function ensureMigrationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

function getMigrationFiles(): string[] {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
    return [];
  }
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();
}

async function getAppliedMigrations(): Promise<Set<string>> {
  const { rows } = await pool.query('SELECT name FROM _migrations ORDER BY id');
  return new Set(rows.map((r: { name: string }) => r.name));
}

async function runMigrations() {
  await ensureMigrationsTable();
  const applied = await getAppliedMigrations();
  const files = getMigrationFiles();
  const pending = files.filter((f) => !applied.has(f));

  if (pending.length === 0) {
    console.log('No pending migrations.');
    await pool.end();
    return;
  }

  console.log(`Found ${pending.length} pending migration(s):\n`);

  for (const file of pending) {
    const filePath = path.join(MIGRATIONS_DIR, file);
    const sql = fs.readFileSync(filePath, 'utf-8');

    console.log(`  Running: ${file} ...`);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
      await client.query('COMMIT');
      console.log(`  ✓ ${file} applied.`);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`  ✗ ${file} FAILED:`, err);
      process.exit(1);
    } finally {
      client.release();
    }
  }

  console.log('\nAll migrations applied successfully.');
  await pool.end();
}

async function showStatus() {
  await ensureMigrationsTable();
  const applied = await getAppliedMigrations();
  const files = getMigrationFiles();

  console.log('Migration Status:\n');
  if (files.length === 0) {
    console.log('  No migration files found in /migrations');
  } else {
    for (const file of files) {
      const status = applied.has(file) ? '✓ applied' : '○ pending';
      console.log(`  ${status}  ${file}`);
    }
  }

  const pendingCount = files.filter((f) => !applied.has(f)).length;
  console.log(`\n  Total: ${files.length} | Applied: ${files.length - pendingCount} | Pending: ${pendingCount}`);
  await pool.end();
}

function createMigration(name: string) {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
  }
  const files = getMigrationFiles();
  const lastNum = files.length > 0
    ? parseInt(files[files.length - 1].split('_')[0])
    : 0;
  const num = String(lastNum + 1).padStart(4, '0');
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  const fileName = `${num}_${slug}.sql`;
  const filePath = path.join(MIGRATIONS_DIR, fileName);

  fs.writeFileSync(filePath, `-- Migration: ${name}\n-- Created: ${new Date().toISOString()}\n\n`, 'utf-8');
  console.log(`Created: migrations/${fileName}`);
}

// CLI
const [command, ...args] = process.argv.slice(2);

if (command === 'status') {
  showStatus();
} else if (command === 'create') {
  const name = args.join(' ');
  if (!name) {
    console.error('Usage: npx tsx scripts/migrate.ts create <migration-name>');
    process.exit(1);
  }
  createMigration(name);
} else {
  runMigrations();
}
