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

import getActiveLocale from './getActiveLocale.js';

test('getActiveLocale returns the published app locale', () => {
  expect(getActiveLocale({ __lowdefy_locale: 'en-ZA' })).toBe('en-ZA');
  expect(getActiveLocale({ __lowdefy_locale: 'zh-Hant-TW' })).toBe('zh-Hant-TW');
});

test('getActiveLocale returns undefined without i18n or for a code Intl rejects', () => {
  expect(getActiveLocale({})).toBeUndefined();
  expect(getActiveLocale({ __lowdefy_locale: 'en_US' })).toBeUndefined();
  expect(getActiveLocale({ __lowdefy_locale: '' })).toBeUndefined();
});
