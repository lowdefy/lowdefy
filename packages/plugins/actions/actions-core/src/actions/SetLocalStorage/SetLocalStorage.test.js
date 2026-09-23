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
import GetLocalStorage from '../GetLocalStorage/GetLocalStorage.js';
import SetLocalStorage from './SetLocalStorage.js';

const mockSetItem = jest.fn();
const globals = { window: { localStorage: { setItem: mockSetItem } } };

beforeEach(() => {
  mockSetItem.mockReset();
});

test('SetLocalStorage writes the serialized value to the key', () => {
  SetLocalStorage({ globals, params: { key: 'settings', value: { theme: 'dark' } } });
  expect(mockSetItem.mock.calls).toEqual([['settings', '{"theme":"dark"}']]);
});

test('SetLocalStorage stores dates so they are read back as Date objects', () => {
  const store = {};
  const dateGlobals = {
    window: {
      localStorage: {
        setItem: (key, value) => {
          store[key] = value;
        },
        getItem: (key) => store[key] ?? null,
      },
    },
  };
  SetLocalStorage({
    globals: dateGlobals,
    params: { key: 'lastSeen', value: { at: new Date(1600000000000) } },
  });
  const result = GetLocalStorage({ globals: dateGlobals, params: { key: 'lastSeen' } });
  expect(result.at).toBeInstanceOf(Date);
  expect(result.at.valueOf()).toEqual(1600000000000);
});

test('SetLocalStorage throws a UserError when the storage quota is exceeded', () => {
  mockSetItem.mockImplementationOnce(() => {
    throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
  });
  let error;
  try {
    SetLocalStorage({ globals, params: { key: 'settings', value: 'a' } });
  } catch (e) {
    error = e;
  }
  expect(error.name).toEqual('UserError');
  expect(error.message).toEqual(
    'SetLocalStorage could not write "settings" to local storage. Local storage is blocked or full in this browser.'
  );
  expect(error.cause.name).toEqual('QuotaExceededError');
});

test('SetLocalStorage throws a UserError when the browser blocks storage access', () => {
  const blockedGlobals = {
    window: {
      get localStorage() {
        throw new DOMException('The operation is insecure.', 'SecurityError');
      },
    },
  };
  let error;
  try {
    SetLocalStorage({ globals: blockedGlobals, params: { key: 'settings', value: 'a' } });
  } catch (e) {
    error = e;
  }
  expect(error.name).toEqual('UserError');
  expect(error.cause.name).toEqual('SecurityError');
});

test('SetLocalStorage throws when params is not an object', () => {
  expect(() => SetLocalStorage({ globals, params: 'settings' })).toThrow(
    'SetLocalStorage params should be an object.'
  );
  expect(mockSetItem.mock.calls).toEqual([]);
});

test('SetLocalStorage throws when key is not a string', () => {
  expect(() => SetLocalStorage({ globals, params: { key: 1, value: 'a' } })).toThrow(
    'SetLocalStorage "key" should be a non-empty string.'
  );
});

test('SetLocalStorage throws when key is an empty string', () => {
  expect(() => SetLocalStorage({ globals, params: { key: '', value: 'a' } })).toThrow(
    'SetLocalStorage "key" should be a non-empty string.'
  );
});

test('SetLocalStorage throws when key uses a reserved Lowdefy prefix', () => {
  expect(() => SetLocalStorage({ globals, params: { key: 'lf-sider-open', value: 'a' } })).toThrow(
    'SetLocalStorage "key" "lf-sider-open" is reserved. Keys starting with "lowdefy_" or "lf-" are used internally by Lowdefy.'
  );
  expect(mockSetItem.mock.calls).toEqual([]);
});

test('SetLocalStorage throws when value is undefined', () => {
  expect(() => SetLocalStorage({ globals, params: { key: 'settings' } })).toThrow(
    'SetLocalStorage "value" is required.'
  );
});
