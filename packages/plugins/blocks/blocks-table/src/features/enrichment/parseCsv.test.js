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

import detectCsvDelimiter from './detectCsvDelimiter.js';
import parseCsv from './parseCsv.js';

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
