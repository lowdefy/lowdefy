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

import getLocaleDateFormat from './getLocaleDateFormat.js';

test('en-US date format', () => {
  expect(getLocaleDateFormat('en-US')).toBe('MM/DD/YYYY');
});

test('de-DE date format', () => {
  expect(getLocaleDateFormat('de-DE')).toBe('DD.MM.YYYY');
});

test('fr-FR date format', () => {
  expect(getLocaleDateFormat('fr-FR')).toBe('DD/MM/YYYY');
});

test('en-GB date format', () => {
  expect(getLocaleDateFormat('en-GB')).toBe('DD/MM/YYYY');
});

test('de-DE datetime format', () => {
  expect(getLocaleDateFormat('de-DE', 'datetime')).toBe('DD.MM.YYYY, HH:mm');
});

test('en-US datetime format uses 24-hour by request', () => {
  expect(getLocaleDateFormat('en-US', 'datetime')).toBe('MM/DD/YYYY, HH:mm');
});

test('de-DE month format uses ICU month-year skeleton', () => {
  // ICU de-DE renders short month-only with "/" rather than the "." that full
  // dates use. We trust the locale data rather than synthesizing our own.
  expect(getLocaleDateFormat('de-DE', 'month')).toBe('MM/YYYY');
});

test('en-US month format', () => {
  expect(getLocaleDateFormat('en-US', 'month')).toBe('MM/YYYY');
});

test('de-DE time format', () => {
  expect(getLocaleDateFormat('de-DE', 'time')).toBe('HH:mm');
});

test('returns null for empty locale', () => {
  expect(getLocaleDateFormat('')).toBeNull();
  expect(getLocaleDateFormat()).toBeNull();
});

test('returns null for non-string locale', () => {
  expect(getLocaleDateFormat(null)).toBeNull();
  expect(getLocaleDateFormat(123)).toBeNull();
});

test('returns null for unknown style', () => {
  expect(getLocaleDateFormat('en-US', 'nonsense')).toBeNull();
});

test('returns null for malformed locale tag', () => {
  expect(getLocaleDateFormat('not-a-real-locale-!!!')).toBeNull();
});
