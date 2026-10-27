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

import createMemoryStore from '../host/createMemoryStore.js';
import GetLocalStorage from './GetLocalStorage.js';
import RemoveLocalStorage from './RemoveLocalStorage.js';
import SetLocalStorage from './SetLocalStorage.js';

const methods = { getAppStorageKey: (key) => `lowdefy:field::${key}` };

function createGlobals() {
  return { storage: createMemoryStore() };
}

test('SetLocalStorage keeps a serialized value under the app key, which GetLocalStorage reads', () => {
  const globals = createGlobals();
  const value = { due: new Date(1600000000000), title: 'Pump' };
  SetLocalStorage({ globals, methods, params: { key: 'draft', value } });
  expect(globals.storage.get('lowdefy:field::draft')).toBe(
    '{"due":{"~d":1600000000000},"title":"Pump"}'
  );
  expect(GetLocalStorage({ globals, methods, params: { key: 'draft' } })).toEqual(value);
});

test('GetLocalStorage gives the default for a key not set, and a plain string as it is', () => {
  const globals = createGlobals();
  expect(GetLocalStorage({ globals, methods, params: { key: 'draft', default: 'none' } })).toBe(
    'none'
  );
  globals.storage.set('lowdefy:field::mode', 'dark');
  expect(GetLocalStorage({ globals, methods, params: { key: 'mode' } })).toBe('dark');
});

test('RemoveLocalStorage removes the app key', () => {
  const globals = createGlobals();
  SetLocalStorage({ globals, methods, params: { key: 'draft', value: 1 } });
  RemoveLocalStorage({ globals, methods, params: { key: 'draft' } });
  expect(globals.storage.keys()).toEqual([]);
});

test('the local storage actions refuse keys Lowdefy keeps for itself', () => {
  const globals = createGlobals();
  expect(() =>
    SetLocalStorage({ globals, methods, params: { key: 'lowdefy_darkMode', value: 'dark' } })
  ).toThrow('SetLocalStorage "key" "lowdefy_darkMode" is reserved.');
  expect(() => GetLocalStorage({ globals, methods, params: { key: '' } })).toThrow(
    'GetLocalStorage "key" should be a non-empty string.'
  );
  expect(() => RemoveLocalStorage({ globals, methods, params: 'draft' })).toThrow(
    'RemoveLocalStorage params should be an object.'
  );
  expect(() => SetLocalStorage({ globals, methods, params: { key: 'draft' } })).toThrow(
    'SetLocalStorage "value" is required.'
  );
});
