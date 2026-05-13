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

import resolveLocale from './resolveLocale.js';

const i18n = {
  defaultLocale: 'en-US',
  locales: [{ code: 'en-US' }, { code: 'de-DE' }, { code: 'fr-FR' }],
};

test('returns the default when there is no Accept-Language header', () => {
  expect(resolveLocale({ i18n, headers: {} })).toBe('en-US');
});

test('returns the default when the header has no matching locale', () => {
  expect(resolveLocale({ i18n, headers: { 'accept-language': 'es-ES' } })).toBe('en-US');
});

test('matches an exact locale code', () => {
  expect(resolveLocale({ i18n, headers: { 'accept-language': 'de-DE' } })).toBe('de-DE');
});

test('respects q-value priority order', () => {
  expect(
    resolveLocale({
      i18n,
      headers: { 'accept-language': 'es-ES;q=0.9,de-DE;q=0.8' },
    })
  ).toBe('de-DE');
});

test('matches by primary language tag when no exact match exists', () => {
  expect(resolveLocale({ i18n, headers: { 'accept-language': 'de' } })).toBe('de-DE');
});

test('prefers higher q-value match over later candidates', () => {
  expect(
    resolveLocale({
      i18n,
      headers: { 'accept-language': 'de-DE;q=0.5,fr-FR;q=0.9' },
    })
  ).toBe('fr-FR');
});

test('returns undefined when no i18n config is set', () => {
  expect(resolveLocale({ i18n: undefined, headers: {} })).toBeUndefined();
  expect(resolveLocale({ i18n: {}, headers: {} })).toBeUndefined();
});
