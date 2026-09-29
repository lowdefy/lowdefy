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

import parseTsv from './parseTsv.js';
import serializeTsv from './serializeTsv.js';

describe('parseTsv', () => {
  test('parseTsv splits rows on newlines and fields on tabs', () => {
    expect(parseTsv('a\tb\nc\td')).toEqual([
      ['a', 'b'],
      ['c', 'd'],
    ]);
  });

  test('parseTsv ignores the trailing newline spreadsheets add', () => {
    expect(parseTsv('a\tb\r\nc\td\r\n')).toEqual([
      ['a', 'b'],
      ['c', 'd'],
    ]);
  });

  test('parseTsv keeps empty fields', () => {
    expect(parseTsv('a\t\tc\n\tb')).toEqual([
      ['a', '', 'c'],
      ['', 'b'],
    ]);
  });

  test('parseTsv reads quoted fields with tabs, newlines and doubled quotes', () => {
    expect(parseTsv('"line 1\nline 2"\t"say ""hi"""\n"a\tb"\tx')).toEqual([
      ['line 1\nline 2', 'say "hi"'],
      ['a\tb', 'x'],
    ]);
  });

  test('parseTsv keeps quotes inside an unquoted field', () => {
    expect(parseTsv('5" screen\tok')).toEqual([['5" screen', 'ok']]);
  });

  test('parseTsv returns no rows for empty text', () => {
    expect(parseTsv('')).toEqual([]);
    expect(parseTsv(null)).toEqual([]);
  });
});

describe('serializeTsv', () => {
  test('serializeTsv joins fields with tabs and rows with newlines', () => {
    expect(
      serializeTsv([
        ['a', 1],
        [null, true],
      ])
    ).toBe('a\t1\n\ttrue');
  });

  test('serializeTsv quotes fields holding tabs, newlines or quotes', () => {
    expect(serializeTsv([['a\tb', 'two\nlines', 'say "hi"']])).toBe(
      '"a\tb"\t"two\nlines"\t"say ""hi"""'
    );
  });

  test('serializeTsv output parses back to the same grid', () => {
    const grid = [
      ['Name', 'Note'],
      ['Ann', 'likes "tea"\tand\ncake'],
      ['', 'x'],
    ];
    expect(parseTsv(serializeTsv(grid))).toEqual(grid);
  });
});
