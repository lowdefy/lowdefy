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

import getLocaleDecimalSeparator from './getLocaleDecimalSeparator.js';

test('en-US decimal separator is a period', () => {
  expect(getLocaleDecimalSeparator('en-US')).toBe('.');
});

test('de-DE decimal separator is a comma', () => {
  expect(getLocaleDecimalSeparator('de-DE')).toBe(',');
});

test('fr-FR decimal separator is a comma', () => {
  expect(getLocaleDecimalSeparator('fr-FR')).toBe(',');
});

test('returns null for empty locale', () => {
  expect(getLocaleDecimalSeparator('')).toBeNull();
  expect(getLocaleDecimalSeparator()).toBeNull();
});

test('returns null for non-string locale', () => {
  expect(getLocaleDecimalSeparator(null)).toBeNull();
  expect(getLocaleDecimalSeparator(123)).toBeNull();
});

test('returns null for malformed locale tag', () => {
  expect(getLocaleDecimalSeparator('not-a-real-locale-!!!')).toBeNull();
});
