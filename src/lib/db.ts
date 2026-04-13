import { Pool } from 'pg';

// Singleton pool shared across all API routes
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export default pool;
