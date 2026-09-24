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

import validateStorageKey from './validateStorageKey.js';

test('validateStorageKey accepts a non-empty key without a reserved prefix', () => {
  expect(() =>
    validateStorageKey({ actionType: 'GetLocalStorage', key: 'settings' })
  ).not.toThrow();
  expect(() =>
    validateStorageKey({ actionType: 'GetLocalStorage', key: 'my_lowdefy_settings' })
  ).not.toThrow();
});

test('validateStorageKey throws when key is not a non-empty string', () => {
  expect(() => validateStorageKey({ actionType: 'GetLocalStorage', key: undefined })).toThrow(
    'GetLocalStorage "key" should be a non-empty string.'
  );
  expect(() => validateStorageKey({ actionType: 'GetLocalStorage', key: '' })).toThrow(
    'GetLocalStorage "key" should be a non-empty string.'
  );
});

test('validateStorageKey throws when key starts with lowdefy_', () => {
  expect(() =>
    validateStorageKey({ actionType: 'SetLocalStorage', key: 'lowdefy_darkMode' })
  ).toThrow('SetLocalStorage "key" "lowdefy_darkMode" is reserved.');
});

test('validateStorageKey throws when key starts with lf-', () => {
  expect(() => validateStorageKey({ actionType: 'SetLocalStorage', key: 'lf-sider-open' })).toThrow(
    'SetLocalStorage "key" "lf-sider-open" is reserved.'
  );
});
