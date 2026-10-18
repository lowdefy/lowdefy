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

import resolveActiveLocale from './resolveActiveLocale.js';

const i18n = {
  defaultLocale: 'en-US',
  locales: [{ code: 'en-US' }, { code: 'af-ZA' }, { code: 'pt-BR' }],
};

test('resolveActiveLocale takes the person choice when the app supports it', () => {
  expect(resolveActiveLocale({ deviceLocales: ['pt-BR'], i18n, preference: 'af-ZA' })).toBe(
    'af-ZA'
  );
  expect(resolveActiveLocale({ deviceLocales: ['pt-BR'], i18n, preference: 'de-DE' })).toBe(
    'pt-BR'
  );
});

test('resolveActiveLocale matches the device locale by code, then by language', () => {
  expect(resolveActiveLocale({ deviceLocales: ['pt-BR'], i18n, preference: 'auto' })).toBe('pt-BR');
  expect(resolveActiveLocale({ deviceLocales: ['pt-PT'], i18n, preference: 'auto' })).toBe('pt-BR');
});

test('resolveActiveLocale falls back to the app default', () => {
  expect(resolveActiveLocale({ deviceLocales: ['ja-JP'], i18n, preference: 'auto' })).toBe('en-US');
});
