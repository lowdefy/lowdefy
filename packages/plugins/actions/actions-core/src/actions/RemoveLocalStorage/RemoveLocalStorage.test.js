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

import { jest } from '@jest/globals';
import RemoveLocalStorage from './RemoveLocalStorage.js';

const mockRemoveItem = jest.fn();
const globals = { window: { localStorage: { removeItem: mockRemoveItem } } };

test('RemoveLocalStorage removes the key from local storage', () => {
  RemoveLocalStorage({ globals, params: { key: 'settings' } });
  expect(mockRemoveItem.mock.calls).toEqual([['settings']]);
});

test('RemoveLocalStorage throws when params is not an object', () => {
  expect(() => RemoveLocalStorage({ globals, params: ['settings'] })).toThrow(
    'RemoveLocalStorage params should be an object. Received ["settings"].'
  );
  expect(mockRemoveItem.mock.calls).toEqual([]);
});

test('RemoveLocalStorage throws when key is not a string', () => {
  expect(() => RemoveLocalStorage({ globals, params: { key: 1 } })).toThrow(
    'RemoveLocalStorage key should be a non-empty string. Received 1.'
  );
});

test('RemoveLocalStorage throws when key is an empty string', () => {
  expect(() => RemoveLocalStorage({ globals, params: { key: '' } })).toThrow(
    'RemoveLocalStorage key should be a non-empty string. Received "".'
  );
});
