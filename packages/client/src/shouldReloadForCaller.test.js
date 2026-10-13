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

import { webcrypto } from 'node:crypto';
import { TextEncoder } from 'node:util';
import { callerHash } from '@lowdefy/helpers';
import { AuthenticationError } from '@lowdefy/errors';

import shouldReloadForCaller from './shouldReloadForCaller.js';

const originalCrypto = globalThis.crypto;

beforeEach(() => {
  Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });
  // jsdom carries neither WebCrypto's digest nor TextEncoder; browsers carry both.
  globalThis.TextEncoder = TextEncoder;
});

afterEach(() => {
  Object.defineProperty(globalThis, 'crypto', { value: originalCrypto, configurable: true });
});

function createWindow() {
  const stored = {};
  return {
    sessionStorage: {
      getItem: (key) => stored[key] ?? null,
      setItem: (key, value) => {
        stored[key] = value;
      },
    },
  };
}

const user = { id: 'user_1', organization_id: 'org_1' };

test('shouldReloadForCaller is false when the server answered as the rendered caller', async () => {
  const serverCaller = await callerHash({ user });
  await expect(shouldReloadForCaller({ serverCaller, user, window: createWindow() })).resolves.toBe(
    false
  );
});

test('shouldReloadForCaller reloads once, then throws an AuthenticationError on a second difference', async () => {
  const window = createWindow();
  const serverCaller = await callerHash({ user: { id: 'user_2', organization_id: 'org_1' } });
  await expect(shouldReloadForCaller({ serverCaller, user, window })).resolves.toBe(true);
  await expect(shouldReloadForCaller({ serverCaller, user, window })).rejects.toBeInstanceOf(
    AuthenticationError
  );
});
