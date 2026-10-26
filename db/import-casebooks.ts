import 'dotenv/config';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { casebookInputSchema } from '../casebookValidation.js';
import { pool } from './index.js';
import { parseCasebookCsv } from './casebookCsv.js';
import type { CasebookCsvRow } from './casebookCsv.js';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const csvPath = resolve(projectRoot, 'data', 'casebook-catalog.csv');

const slugify = (value: string) => value
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '')
  .slice(0, 220) || 'casebook';

const digest = (value: string) => createHash('sha256').update(value).digest('hex');

const buildCasebooks = (rows: CasebookCsvRow[]) => {
  const groups = new Map<string, CasebookCsvRow[]>();
  for (const row of rows) {
    const key = JSON.stringify([
      row.title,
      row.source_org,
      row.source_kind,
      row.year,
      row.license_kind,
      row.permission_reference,
      row.external_url,
      row.industries,
    ]);
    const group = groups.get(key) ?? [];
    group.push(row);
    groups.set(key, group);
  }

  return [...groups.values()].map((group) => {
    const metadata = group[0];
    return casebookInputSchema.parse({
      title: metadata.title,
      sourceOrg: metadata.source_org,
      sourceKind: metadata.source_kind,
      year: metadata.year ? Number(metadata.year) : null,
      description: metadata.case_summary,
      licenseKind: metadata.license_kind,
      permissionReference: metadata.permission_reference,
      externalUrl: metadata.external_url,
      industries: metadata.industries.split(';').map((industry) => industry.trim()).filter(Boolean),
      cases: group.map((row, position) => ({
        title: row.case_title,
        firm: null,
        sector: row.sector,
        caseType: row.case_type || null,
        difficulty: row.difficulty,
        summary: row.case_summary,
        position,
        practiceCaseId: null,
      })),
      rightsConfirmed: true,
      attributionConfirmed: true,
    });
  });
};

async function runImport(): Promise<void> {
  const args = new Set(process.argv.slice(2));
  const allowedArgs = new Set(['--apply', '--confirm-rights', '--confirm-attribution']);
  const unexpectedArg = [...args].find((argument) => !allowedArgs.has(argument));
  if (unexpectedArg) throw new Error(`Unknown argument: ${unexpectedArg}`);

  const rows = parseCasebookCsv(await readFile(csvPath, 'utf8'));
  const casebooks = buildCasebooks(rows);
  if (casebooks.length === 0) {
    console.log('No production casebooks found. The marked example row is excluded.');
    return;
  }
  if (!args.has('--apply')) {
    console.log(`Dry run: ${casebooks.length} casebook(s) validated; no database changes made.`);
    return;
  }
  if (!args.has('--confirm-rights') || !args.has('--confirm-attribution')) {
    throw new Error('Import requires --confirm-rights and --confirm-attribution.');
  }
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required to import casebooks.');

  const uploaderId = process.env.CASEBOOK_IMPORT_UPLOADER_ID;
  if (!uploaderId) throw new Error('Set CASEBOOK_IMPORT_UPLOADER_ID to the configured moderator user ID.');
  const moderators = (process.env.CASE_MODERATOR_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  const uploader = await pool.query<{ email: string }>('SELECT email FROM users WHERE id = $1', [uploaderId]);
  if (!uploader.rows[0] || !moderators.includes(uploader.rows[0].email.toLowerCase())) {
    throw new Error('The import uploader must be an existing user listed in CASE_MODERATOR_EMAILS.');
  }

  let imported = 0;
  let skipped = 0;
  for (const input of casebooks) {
    const fingerprint = digest(JSON.stringify([input.title, input.sourceOrg])).slice(0, 32);
    const id = `casebook_import_${fingerprint}`;
    const slug = `${slugify(input.title)}-${fingerprint.slice(0, 8)}`;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const existing = await client.query('SELECT id FROM casebooks WHERE id = $1', [id]);
      if (existing.rows.length > 0) {
        await client.query('ROLLBACK');
        skipped += 1;
        continue;
      }
      await client.query(
        `INSERT INTO casebooks (
           id, slug, title, source_org, source_kind, year, description, license_kind,
           permission_reference, external_url, industries, case_count, status, uploader_id
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'Pending', $13)`,
        [
          id, slug, input.title, input.sourceOrg, input.sourceKind, input.year ?? null,
          input.description, input.licenseKind, input.permissionReference || null,
          input.externalUrl || null, input.industries, input.cases.length, uploaderId,
        ]
      );
      for (const [position, caseItem] of input.cases.entries()) {
        const caseFingerprint = digest(`${id}\0${position}\0${caseItem.title}`).slice(0, 24);
        await client.query(
          `INSERT INTO casebook_cases (
             id, casebook_id, slug, title, firm, sector, case_type, difficulty,
             summary, body, position, practice_case_id
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NULL, $10, $11)`,
          [
            `casebook_case_import_${caseFingerprint}`,
            id,
            `${slugify(caseItem.title)}-${caseFingerprint.slice(0, 8)}`,
            caseItem.title,
            caseItem.firm ?? null,
            caseItem.sector,
            caseItem.caseType ?? null,
            caseItem.difficulty,
            caseItem.summary,
            position,
            caseItem.practiceCaseId ?? null,
          ]
        );
      }
      await client.query('COMMIT');
      imported += 1;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  console.log(`Imported ${imported} casebook(s) as Pending; skipped ${skipped} existing import(s).`);
}

const isMain = process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;
if (isMain) {
  runImport()
    .catch((error: unknown) => {
      console.error('Casebook import failed:', error);
      process.exitCode = 1;
    })
    .finally(() => pool.end());
}
