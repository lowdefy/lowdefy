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

import getLocaleGroupSeparator from './getLocaleGroupSeparator.js';

test('en-US group separator is a comma', () => {
  expect(getLocaleGroupSeparator('en-US')).toBe(',');
});

test('de-DE group separator is a period', () => {
  expect(getLocaleGroupSeparator('de-DE')).toBe('.');
});

test('returns null for empty locale', () => {
  expect(getLocaleGroupSeparator('')).toBeNull();
  expect(getLocaleGroupSeparator()).toBeNull();
});

test('returns null for non-string locale', () => {
  expect(getLocaleGroupSeparator(null)).toBeNull();
});

test('returns null for malformed locale tag', () => {
  expect(getLocaleGroupSeparator('not-a-real-locale-!!!')).toBeNull();
});
