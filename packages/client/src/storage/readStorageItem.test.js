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

import readStorageItem from './readStorageItem.js';

beforeEach(() => {
  window.localStorage.clear();
});

test('readStorageItem returns the value under the key', () => {
  window.localStorage.setItem('lowdefy:app::lowdefy_locale', 'de-DE');
  window.localStorage.setItem('lowdefy_locale', 'fr-FR');
  expect(
    readStorageItem({
      key: 'lowdefy:app::lowdefy_locale',
      legacyKey: 'lowdefy_locale',
      storage: window.localStorage,
    })
  ).toBe('de-DE');
  expect(window.localStorage.getItem('lowdefy_locale')).toBe('fr-FR');
});

test('readStorageItem moves a value under the legacy key to the key', () => {
  window.localStorage.setItem('lowdefy_locale', 'de-DE');
  expect(
    readStorageItem({
      key: 'lowdefy:app::lowdefy_locale',
      legacyKey: 'lowdefy_locale',
      storage: window.localStorage,
    })
  ).toBe('de-DE');
  expect(window.localStorage.getItem('lowdefy:app::lowdefy_locale')).toBe('de-DE');
  expect(window.localStorage.getItem('lowdefy_locale')).toBeNull();
});

test('readStorageItem returns null when neither key holds a value', () => {
  expect(
    readStorageItem({
      key: 'lowdefy:app::lowdefy_locale',
      legacyKey: 'lowdefy_locale',
      storage: window.localStorage,
    })
  ).toBeNull();
});

test('readStorageItem returns null when the browser blocks storage', () => {
  const storage = {
    getItem: () => {
      throw new DOMException('The operation is insecure.', 'SecurityError');
    },
  };
  expect(readStorageItem({ key: 'a', legacyKey: 'b', storage })).toBeNull();
});
