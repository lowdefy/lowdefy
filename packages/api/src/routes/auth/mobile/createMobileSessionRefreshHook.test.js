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

import { vi, afterEach, beforeEach, expect, test } from 'vitest';

import createMobileSessionRefreshHook from './createMobileSessionRefreshHook.js';

const NOW = new Date('2026-10-18T00:00:00Z').getTime();

beforeEach(() => {
  vi.spyOn(Date, 'now').mockReturnValue(NOW);
});

afterEach(() => {
  vi.restoreAllMocks();
});

function ctxFor(session) {
  return { context: { session: { session, user: { id: 'user_1' } } } };
}

const refresh = { expiresAt: new Date(NOW + 604800 * 1000), updatedAt: new Date(NOW) };

test('a phone session refresh slides forward by the phone lifetime', async () => {
  const hook = createMobileSessionRefreshHook({ sessionExpiresIn: 2592000 });
  expect(await hook(refresh, ctxFor({ id: 's1', mobile: true }))).toEqual({
    data: { ...refresh, expiresAt: new Date(NOW + 2592000 * 1000) },
  });
});

test('a browser session refresh is left alone', async () => {
  const hook = createMobileSessionRefreshHook({ sessionExpiresIn: 2592000 });
  expect(await hook(refresh, ctxFor({ id: 's1' }))).toBeUndefined();
});

test('an update that does not move the expiry is left alone', async () => {
  const hook = createMobileSessionRefreshHook({ sessionExpiresIn: 2592000 });
  expect(
    await hook({ activeOrganizationId: 'org_2' }, ctxFor({ id: 's1', mobile: true }))
  ).toBeUndefined();
});
