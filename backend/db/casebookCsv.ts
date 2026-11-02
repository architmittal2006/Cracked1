export const CASEBOOK_CSV_COLUMNS = [
  'title',
  'source_org',
  'source_kind',
  'year',
  'license_kind',
  'permission_reference',
  'external_url',
  'industries',
  'case_title',
  'case_summary',
  'sector',
  'case_type',
  'difficulty',
] as const;

export type CasebookCsvRow = Record<typeof CASEBOOK_CSV_COLUMNS[number], string>;

export function parseCasebookCsv(content: string): CasebookCsvRow[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let index = 0; index < content.length; index += 1) {
    const character = content[index];
    if (inQuotes) {
      if (character === '"' && content[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        inQuotes = false;
      } else {
        field += character;
      }
    } else if (character === '"' && field.length === 0) {
      inQuotes = true;
    } else if (character === '"') {
      throw new Error(`Unexpected quote in CSV field at character ${index + 1}`);
    } else if (character === ',') {
      row.push(field);
      field = '';
    } else if (character === '\n' || character === '\r') {
      if (character === '\r' && content[index + 1] === '\n') index += 1;
      row.push(field);
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      field = '';
    } else {
      field += character;
    }
  }

  if (inQuotes) throw new Error('Unclosed quoted field in casebook CSV');
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some((value) => value.length > 0)) rows.push(row);
  }

  const headers = rows.shift()?.map((header, index) =>
    index === 0 ? header.replace(/^\uFEFF/, '').trim() : header.trim()
  );
  if (!headers || headers.length !== CASEBOOK_CSV_COLUMNS.length) {
    throw new Error('Casebook CSV must contain the specified 13-column header row');
  }
  if (new Set(headers).size !== headers.length || CASEBOOK_CSV_COLUMNS.some((column) => !headers.includes(column))) {
    throw new Error('Casebook CSV header does not match the required columns');
  }

  return rows.map((values, index) => {
    if (values.length !== headers.length) {
      throw new Error(`Casebook CSV row ${index + 2} has ${values.length} fields; expected ${headers.length}`);
    }
    const record = Object.fromEntries(headers.map((header, fieldIndex) => [header, values[fieldIndex].trim()])) as CasebookCsvRow;
    return record;
  }).filter((record) => record.title !== '__EXAMPLE_ONLY__');
}
