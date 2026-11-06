import 'dotenv/config';
import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Pool } from 'pg';
import { logError } from '../logging.js';

const migrationDirectory = path.resolve(process.cwd(), 'db', 'migrations');
const lockName = 'cracked1_schema_migrations';

export async function applyMigrations(
  pool: Pool,
  directory = migrationDirectory
): Promise<void> {
  const client = await pool.connect();
  let lockAcquired = false;
  try {
    await client.query('SELECT pg_advisory_lock(hashtext($1))', [lockName]);
    lockAcquired = true;
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename VARCHAR(255) PRIMARY KEY,
        checksum VARCHAR(64) NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const filenames = (await readdir(directory))
      .filter((filename) => /^\d+_[a-z0-9_]+\.sql$/i.test(filename))
      .sort();

    for (const filename of filenames) {
      const sql = (await readFile(path.join(directory, filename), 'utf8')).replace(/\r\n/g, '\n');
      const checksum = createHash('sha256').update(sql).digest('hex');
      try {
        await client.query('BEGIN');
        const previous = await client.query<{ checksum: string }>(
          'SELECT checksum FROM schema_migrations WHERE filename = $1',
          [filename]
        );
        if (previous.rows[0]) {
          if (previous.rows[0].checksum !== checksum) {
            throw new Error(`Applied migration was changed: ${filename}`);
          }
          await client.query('COMMIT');
          continue;
        }

        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (filename, checksum) VALUES ($1, $2)',
          [filename, checksum]
        );
        await client.query('COMMIT');
        console.log(`Applied migration ${filename}`);
      } catch (error) {
        try {
          await client.query('ROLLBACK');
        } catch (rollbackError) {
          throw new AggregateError(
            [error, rollbackError],
            `Migration ${filename} failed and its transaction could not be rolled back`
          );
        }
        throw error;
      }
    }
  } finally {
    try {
      if (lockAcquired) {
        await client.query('SELECT pg_advisory_unlock(hashtext($1))', [lockName]);
      }
    } finally {
      client.release();
    }
  }
}

export async function assertMigrationsCurrent(
  pool: Pool,
  directory = migrationDirectory
): Promise<void> {
  const filenames = (await readdir(directory))
    .filter((filename) => /^\d+_[a-z0-9_]+\.sql$/i.test(filename))
    .sort();
  const result = await pool.query<{ filename: string; checksum: string }>(
    'SELECT filename, checksum FROM schema_migrations ORDER BY filename'
  );
  const applied = new Map(result.rows.map((row) => [row.filename, row.checksum]));

  for (const filename of filenames) {
    const sql = (await readFile(path.join(directory, filename), 'utf8')).replace(/\r\n/g, '\n');
    const checksum = createHash('sha256').update(sql).digest('hex');
    const previous = applied.get(filename);
    if (!previous) {
      throw new Error(`Database is missing migration ${filename}; run npm run migrate`);
    }
    if (previous !== checksum) {
      throw new Error(`Database migration checksum differs for ${filename}; run npm run migrate`);
    }
    applied.delete(filename);
  }
  if (applied.size > 0) {
    throw new Error(`Database contains unknown migration ${applied.keys().next().value}`);
  }
}

async function runMigrations(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL must be set to run migrations');
  }

  const pool = new Pool({ connectionString });
  try {
    await applyMigrations(pool);
  } finally {
    await pool.end();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runMigrations().catch((error: unknown) => {
    logError('Database migration failed', error);
    process.exitCode = 1;
  });
}
