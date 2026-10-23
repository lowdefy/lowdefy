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

import { vi, beforeEach, expect, test } from 'vitest';
import GetLocalStorage from './GetLocalStorage.js';

const mockGetItem = vi.fn();
const globals = { window: { localStorage: { getItem: mockGetItem } } };
const methods = { getAppStorageKey: (key) => `lowdefy:app::${key}` };

function createStorage(entries) {
  const store = { ...entries };
  return {
    store,
    storage: {
      getItem: (key) => store[key] ?? null,
      removeItem: (key) => {
        delete store[key];
      },
      setItem: (key, value) => {
        store[key] = value;
      },
    },
  };
}

beforeEach(() => {
  mockGetItem.mockReset();
});

test('GetLocalStorage returns the deserialized value stored under the app key', () => {
  mockGetItem.mockReturnValueOnce('{"theme":"dark"}');
  expect(GetLocalStorage({ globals, methods, params: { key: 'settings' } })).toEqual({
    theme: 'dark',
  });
  expect(mockGetItem.mock.calls).toEqual([['lowdefy:app::settings']]);
});

test('GetLocalStorage moves a value set before keys were kept per app to the app key', () => {
  const { storage, store } = createStorage({ settings: '{"theme":"dark"}' });
  const result = GetLocalStorage({
    globals: { window: { localStorage: storage } },
    methods,
    params: { key: 'settings' },
  });
  expect(result).toEqual({ theme: 'dark' });
  expect(store).toEqual({ 'lowdefy:app::settings': '{"theme":"dark"}' });
});

test('GetLocalStorage prefers the app key over a value left under the bare key', () => {
  const { storage, store } = createStorage({
    'lowdefy:app::settings': '"new"',
    settings: '"old"',
  });
  const result = GetLocalStorage({
    globals: { window: { localStorage: storage } },
    methods,
    params: { key: 'settings' },
  });
  expect(result).toEqual('new');
  expect(store).toEqual({ 'lowdefy:app::settings': '"new"', settings: '"old"' });
});

test('GetLocalStorage returns a value under the bare key when moving it fails', () => {
  const { storage, store } = createStorage({ settings: '"old"' });
  storage.setItem = () => {
    throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
  };
  const result = GetLocalStorage({
    globals: { window: { localStorage: storage } },
    methods,
    params: { key: 'settings' },
  });
  expect(result).toEqual('old');
  expect(store).toEqual({ settings: '"old"' });
});

test('GetLocalStorage returns a Date object for a stored date', () => {
  mockGetItem.mockReturnValueOnce('{"~d":1600000000000}');
  const result = GetLocalStorage({ globals, methods, params: { key: 'lastSeen' } });
  expect(result).toBeInstanceOf(Date);
  expect(result.valueOf()).toEqual(1600000000000);
});

test('GetLocalStorage returns the raw string when the stored value is not serialized JSON', () => {
  mockGetItem.mockReturnValueOnce('dark');
  expect(GetLocalStorage({ globals, methods, params: { key: 'theme' } })).toEqual('dark');
});

test('GetLocalStorage returns the default value when the key is not set', () => {
  mockGetItem.mockReturnValue(null);
  expect(
    GetLocalStorage({ globals, methods, params: { key: 'settings', default: { theme: 'light' } } })
  ).toEqual({ theme: 'light' });
});

test('GetLocalStorage returns undefined when the key is not set and no default is given', () => {
  mockGetItem.mockReturnValue(null);
  expect(GetLocalStorage({ globals, methods, params: { key: 'settings' } })).toBeUndefined();
});

test('GetLocalStorage returns the stored value when it is null', () => {
  mockGetItem.mockReturnValueOnce('null');
  expect(
    GetLocalStorage({ globals, methods, params: { key: 'settings', default: 'fallback' } })
  ).toBeNull();
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
    GetLocalStorage({
      globals: blockedGlobals,
      methods,
      params: { key: 'settings', default: 'fallback' },
    })
  ).toEqual('fallback');
});

test('GetLocalStorage returns the default value when reading the key throws', () => {
  mockGetItem.mockImplementationOnce(() => {
    throw new DOMException('The operation is insecure.', 'SecurityError');
  });
  expect(
    GetLocalStorage({ globals, methods, params: { key: 'settings', default: 'fallback' } })
  ).toEqual('fallback');
});

test('GetLocalStorage throws when params is not an object', () => {
  expect(() => GetLocalStorage({ globals, methods, params: 'settings' })).toThrow(
    'GetLocalStorage params should be an object.'
  );
});

test('GetLocalStorage throws when key is not a string', () => {
  expect(() => GetLocalStorage({ globals, methods, params: { key: null } })).toThrow(
    'GetLocalStorage "key" should be a non-empty string.'
  );
});

test('GetLocalStorage throws when key is an empty string', () => {
  expect(() => GetLocalStorage({ globals, methods, params: { key: '' } })).toThrow(
    'GetLocalStorage "key" should be a non-empty string.'
  );
});

test('GetLocalStorage throws when key uses a reserved Lowdefy prefix', () => {
  expect(() => GetLocalStorage({ globals, methods, params: { key: 'lowdefy_darkMode' } })).toThrow(
    'GetLocalStorage "key" "lowdefy_darkMode" is reserved. Keys starting with "lowdefy_" or "lf-" are used internally by Lowdefy.'
  );
  expect(mockGetItem.mock.calls).toEqual([]);
});
