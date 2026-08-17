/*
  Copyright 2020-2026 Lowdefy, Inc

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

import { reportContentDisposition, sanitizeReportFilename } from './downloadName.js';

const disposition = (requested, fallback = 'report1.pdf') =>
  reportContentDisposition({ requested, fallback });

describe('sanitizeReportFilename', () => {
  test('strips the characters that would break the header or name a path', () => {
    expect(sanitizeReportFilename('Q3/"report".pdf')).toBe('Q3report.pdf');
    expect(sanitizeReportFilename('a\\b.pdf')).toBe('ab.pdf');
    // A header split is the reason control bytes go, not just tidiness.
    expect(sanitizeReportFilename('evil\r\nSet-Cookie: x=1.pdf')).toBe('evilSet-Cookie: x=1.pdf');
  });

  test('keeps accents — they are encoded later, not stripped', () => {
    expect(sanitizeReportFilename('Rapport Août.pdf')).toBe('Rapport Août.pdf');
  });

  test('a non-string is no name at all', () => {
    expect(sanitizeReportFilename(undefined)).toBe('');
    expect(sanitizeReportFilename(42)).toBe('');
  });
});

describe('reportContentDisposition', () => {
  test('an ASCII name is written the same way twice', () => {
    expect(disposition('sales.pdf')).toBe(
      `attachment; filename="sales.pdf"; filename*=UTF-8''sales.pdf`
    );
  });

  test('an accented name keeps an ASCII fallback and an encoded original', () => {
    expect(disposition('Rapport Août.pdf')).toBe(
      `attachment; filename="Rapport Ao_t.pdf"; filename*=UTF-8''Rapport%20Ao%C3%BBt.pdf`
    );
  });

  test('a name with no ASCII at all still has a usable extension', () => {
    expect(disposition('销售报告.xlsx')).toBe(
      `attachment; filename="____.xlsx"; filename*=UTF-8''%E9%94%80%E5%94%AE%E6%8A%A5%E5%91%8A.xlsx`
    );
  });

  // RFC 5987 attr-char excludes these, and encodeURIComponent leaves them alone.
  test("encodes the ' ( ) * ! that encodeURIComponent would not", () => {
    const value = disposition(`Q3 (final)*!'.pdf`);
    expect(value).toBe(
      `attachment; filename="Q3 (final)*!'.pdf"; ` +
        `filename*=UTF-8''Q3%20%28final%29%2A%21%27.pdf`
    );
    const encoded = /filename\*=UTF-8''(.+)$/.exec(value)[1];
    expect(decodeURIComponent(encoded)).toBe(`Q3 (final)*!'.pdf`);
  });

  test('falls back to the generated name, then to a constant', () => {
    expect(disposition(undefined)).toContain('filename="report1.pdf"');
    // A requested name that sanitizes away to nothing is no name.
    expect(disposition('///')).toContain('filename="report1.pdf"');
    expect(reportContentDisposition({})).toBe(
      `attachment; filename="report"; filename*=UTF-8''report`
    );
  });
});
