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

import createDeviceKey from './createDeviceKey.js';

jest.mock('expo-secure-store', () =>
  jest.requireActual('../test/createFakeSecureStore.js').default()
);
jest.mock('expo-crypto', () => ({
  getRandomBytes: jest.fn((count) => Uint8Array.from({ length: count }, (_, index) => index)),
}));

const SecureStore = jest.requireMock('expo-secure-store');
const Crypto = jest.requireMock('expo-crypto');

beforeEach(() => {
  SecureStore.items.clear();
});

test('a device key is made once, kept on this device only and read back after', async () => {
  const getDeviceKey = createDeviceKey({ appId: 'field' });
  const key = await getDeviceKey();
  expect(key).toMatch(/^[0-9a-f]{64}$/);
  expect(await getDeviceKey()).toBe(key);
  expect(Crypto.getRandomBytes).toHaveBeenCalledTimes(1);
  expect(SecureStore.setItemAsync).toHaveBeenCalledWith('lowdefy-device-key.field', key, {
    keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
  });
  // A new shell launch reads the stored key rather than making another.
  expect(await createDeviceKey({ appId: 'field' })()).toBe(key);
  expect(Crypto.getRandomBytes).toHaveBeenCalledTimes(1);
});

test('each app on the phone has its own device key', async () => {
  const field = await createDeviceKey({ appId: 'field' })();
  Crypto.getRandomBytes.mockImplementationOnce((count) => new Uint8Array(count).fill(9));
  const office = await createDeviceKey({ appId: 'office' })();
  expect(office).not.toBe(field);
});
