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

import { jest } from '@jest/globals';

import detectCsvDelimiter from './detectCsvDelimiter.js';
import parseCsv from './parseCsv.js';
import readCsvFile from './readCsvFile.js';

test('parseCsv splits records and fields', () => {
  expect(parseCsv('name,domain\nAcme,acme.com\nGlobex,globex.com')).toEqual([
    ['name', 'domain'],
    ['Acme', 'acme.com'],
    ['Globex', 'globex.com'],
  ]);
});

test('parseCsv reads quoted fields with delimiters, line breaks and escaped quotes', () => {
  expect(parseCsv('a,b\n"x, y","say ""hi""\nthere"\n')).toEqual([
    ['a', 'b'],
    ['x, y', 'say "hi"\nthere'],
  ]);
});

test('parseCsv accepts CRLF, LF and CR line endings', () => {
  expect(parseCsv('a,b\r\n1,2\n3,4\r5,6\r\n')).toEqual([
    ['a', 'b'],
    ['1', '2'],
    ['3', '4'],
    ['5', '6'],
  ]);
});

test('parseCsv drops a byte order mark', () => {
  expect(parseCsv('﻿name\nAcme')).toEqual([['name'], ['Acme']]);
});

test('parseCsv skips blank lines but keeps empty fields', () => {
  expect(parseCsv('a,b,c\n\n1,,3\n,,\n\n')).toEqual([
    ['a', 'b', 'c'],
    ['1', '', '3'],
    ['', '', ''],
  ]);
});

test('parseCsv keeps a line holding only an empty quoted field as a record', () => {
  expect(parseCsv('a\n""\nb')).toEqual([['a'], [''], ['b']]);
});

test('parseCsv keeps quotes inside unquoted fields and text after a closing quote', () => {
  expect(parseCsv('5" screen,"quoted"rest')).toEqual([['5" screen', 'quotedrest']]);
});

test('parseCsv keeps ragged records as they are', () => {
  expect(parseCsv('a,b,c\n1\n1,2,3,4')).toEqual([['a', 'b', 'c'], ['1'], ['1', '2', '3', '4']]);
});

test('parseCsv ends an unterminated quoted field at the end of the text', () => {
  expect(parseCsv('a,"b\nc')).toEqual([['a', 'b\nc']]);
});

test('parseCsv of empty text has no records', () => {
  expect(parseCsv('')).toEqual([]);
  expect(parseCsv('\r\n\n')).toEqual([]);
});

test('parseCsv detects semicolon and tab delimiters from the first line', () => {
  expect(parseCsv('name;amount\nAcme;1,5')).toEqual([
    ['name', 'amount'],
    ['Acme', '1,5'],
  ]);
  expect(parseCsv('name\tdomain\nAcme\tacme.com')).toEqual([
    ['name', 'domain'],
    ['Acme', 'acme.com'],
  ]);
});

test('parseCsv takes an explicit delimiter', () => {
  expect(parseCsv('a;b,c', { delimiter: ',' })).toEqual([['a;b', 'c']]);
});

test('detectCsvDelimiter ignores delimiters inside quotes and defaults to comma', () => {
  expect(detectCsvDelimiter('"a;b;c",d\n')).toBe(',');
  expect(detectCsvDelimiter('single')).toBe(',');
});

test('parseCsv ends a record with an empty field after a trailing delimiter', () => {
  expect(parseCsv('a,')).toEqual([['a', '']]);
  expect(parseCsv(',')).toEqual([['', '']]);
  expect(parseCsv('a,\nb')).toEqual([['a', ''], ['b']]);
  expect(parseCsv('"a"')).toEqual([['a']]);
  expect(parseCsv(' "a",b')).toEqual([[' "a"', 'b']]);
});

test('parseCsv parses 100,000 records in well under a second', () => {
  const lines = ['name,title,notes'];
  for (let i = 0; i < 100000; i++) lines.push(`Person ${i},"Head of, Ops",said ""hi""`);
  const started = Date.now();
  const records = parseCsv(lines.join('\n'));
  expect(records).toHaveLength(100001);
  expect(records[5]).toEqual(['Person 4', 'Head of, Ops', 'said ""hi""']);
  expect(Date.now() - started).toBeLessThan(1000);
});

describe('readCsvFile', () => {
  function csvFile(text, size = text.length) {
    return { size, text: jest.fn(async () => text) };
  }

  test('readCsvFile refuses a file larger than the size limit without reading it', async () => {
    const file = csvFile('a\n1', 60 * 1024 * 1024);
    await expect(readCsvFile({ file })).rejects.toThrow(
      'The file is 60 MB. Import files of at most 50 MB: split larger files.'
    );
    expect(file.text).not.toHaveBeenCalled();
  });

  test('readCsvFile refuses a file with more rows than the row limit', async () => {
    const file = csvFile(['a', '1', '2', '3'].join('\n'));
    await expect(readCsvFile({ file, maxRows: 2 })).rejects.toThrow(
      'The file has more than 2 rows. Import at most 2 rows at a time: split larger files.'
    );
  });

  test('readCsvFile reads the records, pausing between slices so the page stays responsive', async () => {
    const lines = ['name'];
    for (let i = 0; i < 5000; i++) lines.push(`Person ${i}`);
    const pause = jest.fn(async () => {});
    const records = await readCsvFile({ file: csvFile(lines.join('\n')), sliceMs: 0, pause });
    expect(records).toHaveLength(5001);
    expect(records[5000]).toEqual(['Person 4999']);
    expect(pause.mock.calls.length).toBeGreaterThan(1);
  });
});
