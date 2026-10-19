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

import toCsvField from './toCsvField.js';

test('toCsvField leaves plain text as it is', () => {
  expect(toCsvField('Ada Lovelace')).toBe('Ada Lovelace');
});

test('toCsvField quotes fields with commas, quotes and line breaks', () => {
  expect(toCsvField('a,b')).toBe('"a,b"');
  expect(toCsvField('say "hi"')).toBe('"say ""hi"""');
  expect(toCsvField('line\nbreak')).toBe('"line\nbreak"');
});

test('toCsvField prefixes cells that start like a formula with a single quote', () => {
  expect(toCsvField('=1+1')).toBe("'=1+1");
  expect(toCsvField('+SUM(A1:A2)')).toBe("'+SUM(A1:A2)");
  expect(toCsvField('-2+3')).toBe("'-2+3");
  expect(toCsvField('@SUM(A1)')).toBe("'@SUM(A1)");
  expect(toCsvField('\t=1')).toBe("'\t=1");
});

test('toCsvField prefixes a formula before quoting it, so the quote stays inside the field', () => {
  expect(toCsvField('=HYPERLINK("http://example.com","Click")')).toBe(
    '"\'=HYPERLINK(""http://example.com"",""Click"")"'
  );
  expect(toCsvField('\r=1')).toBe('"\'\r=1"');
});

test('toCsvField keeps plain numbers, negative and signed ones included, as numbers', () => {
  expect(toCsvField(-12.5)).toBe('-12.5');
  expect(toCsvField('-12.5')).toBe('-12.5');
  expect(toCsvField('+3')).toBe('+3');
  expect(toCsvField(1e-7)).toBe('1e-7');
  expect(toCsvField('-.5')).toBe('-.5');
  expect(toCsvField(0)).toBe('0');
});

test('toCsvField neutralises formatted values that are not plain numbers', () => {
  expect(toCsvField('-$1,234.50')).toBe('"\'-$1,234.50"');
  expect(toCsvField('- item')).toBe("'- item");
});

test('toCsvField leaves formula characters after the first one alone', () => {
  expect(toCsvField('a=b')).toBe('a=b');
  expect(toCsvField('user@example.com')).toBe('user@example.com');
});
