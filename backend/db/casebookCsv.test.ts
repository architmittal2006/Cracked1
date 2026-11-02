import { describe, expect, it } from 'vitest';
import { parseCasebookCsv } from './casebookCsv.js';

const header = 'title,source_org,source_kind,year,license_kind,permission_reference,external_url,industries,case_title,case_summary,sector,case_type,difficulty';

describe('casebook catalog CSV', () => {
  it('parses quoted commas and line breaks and excludes the example row', () => {
    const csv = `${header}\r\n__EXAMPLE_ONLY__,,,,,,,,,,,,\r\n"Retail, growth","University of Example",university,2025,permission,"Written permission","","Retail;Consumer","Market entry","A summary,\nwritten by the contributor.",Retail,"Market Entry",Standard`;
    const rows = parseCasebookCsv(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe('Retail, growth');
    expect(rows[0].case_summary).toBe('A summary,\nwritten by the contributor.');
  });

  it('rejects malformed quotes and header shapes', () => {
    expect(() => parseCasebookCsv(`${header}\n"Unclosed`)).toThrow('Unclosed quoted field');
    expect(() => parseCasebookCsv('title,source_org\nExample,Source')).toThrow('13-column header');
  });
});
