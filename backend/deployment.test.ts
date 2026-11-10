import { readFile } from 'node:fs/promises';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

// Imports the migration seeder module; give it headroom under parallel workers.
describe('split frontend and backend deployment', { timeout: 20000 }, () => {
  it('runs migrations before starting the API without running the demo-data seeder', async () => {
    const renderConfig = await readFile(new URL('./render.yaml', import.meta.url), 'utf8');

    expect(renderConfig).toMatch(/rootDir:\s*backend/);
    expect(renderConfig).toMatch(/startCommand:\s*npm run migrate\s*&&\s*npm run start\s*$/m);
    expect(renderConfig).not.toMatch(/startCommand:.*seed:demo/);
  });

  it('keeps Vercel configuration beside the frontend and proxies API requests to Render', async () => {
    const vercelConfig = JSON.parse(
      await readFile(new URL('../frontend/vercel.json', import.meta.url), 'utf8'),
    );
    const apiRewrite = vercelConfig.rewrites.find(
      (rewrite: { source: string }) => rewrite.source === '/api/:path*',
    );

    expect(apiRewrite?.destination).toBe('https://cracked1-1-veul.onrender.com/api/:path*');
  });

  it('loads migration seed data from the new frontend folder', async () => {
    const migrationSource = await readFile(new URL('./db/migrate.ts', import.meta.url), 'utf8');

    expect(migrationSource).toContain('../frontend/src/data/mockData.js');
  });

  it('refuses to run the demo-data seeder in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');

    await expect(import('./db/migrate.js')).rejects.toThrow(
      'Demo data seeding is disabled in production',
    );
  });
});
