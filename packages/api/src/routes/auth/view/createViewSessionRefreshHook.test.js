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

import { expect, test } from 'vitest';

import createViewSessionRefreshHook from './createViewSessionRefreshHook.js';

const mintedExpiry = new Date('2026-11-12T10:15:00Z');
const slidExpiry = new Date('2026-11-19T10:05:00Z');
const refresh = { expiresAt: slidExpiry, updatedAt: new Date('2026-11-12T10:05:00Z') };

function ctxFor(session) {
  return { context: { session: { session, user: { id: 'user_1' } } } };
}

test('a view session refresh keeps the expiry the session was minted with', async () => {
  const hook = createViewSessionRefreshHook();
  expect(await hook(refresh, ctxFor({ id: 's1', view: true, expiresAt: mintedExpiry }))).toEqual({
    data: { ...refresh, expiresAt: mintedExpiry },
  });
});

test('a browser or phone session refresh is left alone', async () => {
  const hook = createViewSessionRefreshHook();
  expect(await hook(refresh, ctxFor({ id: 's1', expiresAt: mintedExpiry }))).toBeUndefined();
  expect(
    await hook(refresh, ctxFor({ id: 's1', mobile: true, expiresAt: mintedExpiry }))
  ).toBeUndefined();
});

test('a view session update that does not move the expiry is left alone', async () => {
  const hook = createViewSessionRefreshHook();
  expect(
    await hook({ updatedAt: new Date() }, ctxFor({ id: 's1', view: true, expiresAt: mintedExpiry }))
  ).toBeUndefined();
});

test('an update outside a request that carries a session is left alone', async () => {
  const hook = createViewSessionRefreshHook();
  expect(await hook(refresh, undefined)).toBeUndefined();
  expect(await hook(refresh, { context: {} })).toBeUndefined();
});
