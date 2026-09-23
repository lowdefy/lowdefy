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
import GetLocalStorage from './GetLocalStorage.js';

const mockGetItem = jest.fn();
const globals = { window: { localStorage: { getItem: mockGetItem } } };

beforeEach(() => {
  mockGetItem.mockReset();
});

test('GetLocalStorage returns the deserialized value stored at the key', () => {
  mockGetItem.mockReturnValueOnce('{"theme":"dark"}');
  expect(GetLocalStorage({ globals, params: { key: 'settings' } })).toEqual({ theme: 'dark' });
  expect(mockGetItem.mock.calls).toEqual([['settings']]);
});

test('GetLocalStorage returns a Date object for a stored date', () => {
  mockGetItem.mockReturnValueOnce('{"~d":1600000000000}');
  const result = GetLocalStorage({ globals, params: { key: 'lastSeen' } });
  expect(result).toBeInstanceOf(Date);
  expect(result.valueOf()).toEqual(1600000000000);
});

test('GetLocalStorage returns the raw string when the stored value is not serialized JSON', () => {
  mockGetItem.mockReturnValueOnce('dark');
  expect(GetLocalStorage({ globals, params: { key: 'theme' } })).toEqual('dark');
});

test('GetLocalStorage returns the default value when the key is not set', () => {
  mockGetItem.mockReturnValueOnce(null);
  expect(
    GetLocalStorage({ globals, params: { key: 'settings', default: { theme: 'light' } } })
  ).toEqual({ theme: 'light' });
});

test('GetLocalStorage returns undefined when the key is not set and no default is given', () => {
  mockGetItem.mockReturnValueOnce(null);
  expect(GetLocalStorage({ globals, params: { key: 'settings' } })).toBeUndefined();
});

test('GetLocalStorage returns the stored value when it is null', () => {
  mockGetItem.mockReturnValueOnce('null');
  expect(GetLocalStorage({ globals, params: { key: 'settings', default: 'fallback' } })).toBeNull();
});

test('GetLocalStorage returns the default value when the browser blocks storage access', () => {
  const blockedGlobals = {
    window: {
      get localStorage() {
        throw new DOMException('The operation is insecure.', 'SecurityError');
      },
    },
  };
  expect(
    GetLocalStorage({ globals: blockedGlobals, params: { key: 'settings', default: 'fallback' } })
  ).toEqual('fallback');
});

test('GetLocalStorage returns the default value when reading the key throws', () => {
  mockGetItem.mockImplementationOnce(() => {
    throw new DOMException('The operation is insecure.', 'SecurityError');
  });
  expect(GetLocalStorage({ globals, params: { key: 'settings', default: 'fallback' } })).toEqual(
    'fallback'
  );
});

test('GetLocalStorage throws when params is not an object', () => {
  expect(() => GetLocalStorage({ globals, params: 'settings' })).toThrow(
    'GetLocalStorage params should be an object.'
  );
});

test('GetLocalStorage throws when key is not a string', () => {
  expect(() => GetLocalStorage({ globals, params: { key: null } })).toThrow(
    'GetLocalStorage "key" should be a non-empty string.'
  );
});

test('GetLocalStorage throws when key is an empty string', () => {
  expect(() => GetLocalStorage({ globals, params: { key: '' } })).toThrow(
    'GetLocalStorage "key" should be a non-empty string.'
  );
});

test('GetLocalStorage throws when key uses a reserved Lowdefy prefix', () => {
  expect(() => GetLocalStorage({ globals, params: { key: 'lowdefy_darkMode' } })).toThrow(
    'GetLocalStorage "key" "lowdefy_darkMode" is reserved. Keys starting with "lowdefy_" or "lf-" are used internally by Lowdefy.'
  );
  expect(mockGetItem.mock.calls).toEqual([]);
});
