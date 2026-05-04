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

import _locale from './locale.js';

const i18n = {
  active: 'de-DE',
  defaultLocale: 'en-US',
  locales: [
    { code: 'en-US', label: 'English' },
    { code: 'de-DE', label: 'Deutsch' },
  ],
};

test('_locale with true returns the full view', () => {
  expect(_locale({ params: true, location: 'l', i18n })).toEqual({
    active: 'de-DE',
    default: 'en-US',
    fallback: 'en-US',
    supported: [
      { code: 'en-US', label: 'English' },
      { code: 'de-DE', label: 'Deutsch' },
    ],
  });
});

test('_locale active reads the active code', () => {
  expect(_locale({ params: 'active', location: 'l', i18n })).toBe('de-DE');
});

test('_locale default reads the configured default', () => {
  expect(_locale({ params: 'default', location: 'l', i18n })).toBe('en-US');
});

test('_locale fallback always returns en-US', () => {
  expect(_locale({ params: 'fallback', location: 'l', i18n })).toBe('en-US');
});

test('_locale fallback returns en-US even when i18n is unset', () => {
  expect(_locale({ params: 'fallback', location: 'l' })).toBe('en-US');
});

test('_locale supported returns the list of locales', () => {
  expect(_locale({ params: 'supported', location: 'l', i18n })).toEqual(i18n.locales);
});

test('_locale supported is an empty array when i18n is undefined', () => {
  expect(_locale({ params: 'supported', location: 'l' })).toEqual([]);
});

test('_locale active is undefined when i18n is unset', () => {
  expect(_locale({ params: 'active', location: 'l' })).toBeUndefined();
});
