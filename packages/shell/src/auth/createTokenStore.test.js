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

import createMemoryStore from '../host/createMemoryStore.js';
import createTokenStore from './createTokenStore.js';

jest.mock('expo-secure-store', () =>
  jest.requireActual('../test/createFakeSecureStore.js').default()
);

const SecureStore = jest.requireMock('expo-secure-store');

const KEY = 'lowdefy-session-token.field';

beforeEach(() => {
  SecureStore.items.clear();
});

function create({ background = false, biometric = false, kv = createMemoryStore() } = {}) {
  return {
    kv,
    store: createTokenStore({ appId: 'field', background, getBiometric: () => biometric, kv }),
  };
}

test('a shell without background work keeps the token readable only while the phone is unlocked', async () => {
  const { store } = create();
  await store.set('token-1');
  expect(SecureStore.items.get(`${KEY}|no-auth`)).toEqual({
    value: 'token-1',
    options: { keychainAccessible: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY' },
  });
  expect(store.isProtected()).toBe(false);
});

test('with biometric unlock the token is kept behind Face ID or a fingerprint', async () => {
  const { store } = create({ biometric: true });
  await store.set('token-1');
  expect(SecureStore.items.get(`${KEY}|auth`).options).toEqual({
    keychainAccessible: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
    requireAuthentication: true,
    authenticationPrompt: 'Unlock to continue',
  });
  expect(store.isProtected()).toBe(true);
});

test('a shell with background work keeps the token readable after first unlock, biometrics or not', async () => {
  const { store } = create({ background: true, biometric: true });
  await store.set('token-1');
  expect(SecureStore.items.get(`${KEY}|no-auth`).options).toEqual({
    keychainAccessible: 'AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY',
  });
  expect(store.isProtected()).toBe(false);
});

test('the token is read once, with the options it was written with, and held in memory', async () => {
  const kv = createMemoryStore();
  await create({ biometric: true, kv }).store.set('token-1');
  const { store } = create({ biometric: true, kv });
  expect(store.get()).toBeNull();
  await store.load();
  expect(SecureStore.getItemAsync).toHaveBeenLastCalledWith(
    KEY,
    expect.objectContaining({ requireAuthentication: true })
  );
  SecureStore.getItemAsync.mockClear();
  expect(store.get()).toBe('token-1');
  expect(store.get()).toBe('token-1');
  expect(SecureStore.getItemAsync).not.toHaveBeenCalled();
  store.unload();
  expect(store.get()).toBeNull();
});

test('a change of unlock mode moves the token, leaving no copy behind', async () => {
  let biometric = false;
  const store = createTokenStore({
    appId: 'field',
    background: false,
    getBiometric: () => biometric,
    kv: createMemoryStore(),
  });
  await store.set('token-1');
  biometric = true;
  await store.set('token-2');
  expect([...SecureStore.items.keys()]).toEqual([`${KEY}|auth`]);
});

test('set and clear tell subscribers; clear removes every copy of the token', async () => {
  const { kv, store } = create();
  const listener = jest.fn();
  store.subscribe(listener);
  await store.set('token-1');
  expect(listener).toHaveBeenLastCalledWith('token-1');
  await store.clear();
  expect(listener).toHaveBeenLastCalledWith(null);
  expect(SecureStore.items.size).toBe(0);
  expect(kv.keys()).toEqual([]);
  listener.mockClear();
  await store.clear();
  expect(listener).not.toHaveBeenCalled();
});
