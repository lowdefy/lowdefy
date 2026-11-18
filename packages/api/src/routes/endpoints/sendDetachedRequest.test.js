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

import { afterEach, expect, test, vi } from 'vitest';
import { serializer } from '@lowdefy/helpers';

const mockDispatchDetached = vi.fn(async () => ({ status: 202 }));
vi.doMock('./dispatchDetached.js', () => ({ default: mockDispatchDetached }));

const { default: sendDetachedRequest } = await import('./sendDetachedRequest.js');

afterEach(() => {
  vi.unstubAllEnvs();
  mockDispatchDetached.mockClear();
});

// The principal is what the /api/detached receiver rehydrates the target's caller from, so every
// part of the dispatcher's identity must cross the hop: a view session's detached run is held to
// its grant's scopes as the dispatching run is.
test('sendDetachedRequest carries the dispatcher principal, view session included, on the loopback body', async () => {
  vi.stubEnv('CRON_SECRET', 'shhh');
  const waitUntil = vi.fn();
  const context = {
    logger: { info: vi.fn(), warn: vi.fn() },
    origin: 'https://app.test',
    waitUntil,
  };
  const viewSession = { id: 'vs_1', scopes: ['orders:read'] };
  sendDetachedRequest(context, {
    callContext: {
      user: { id: 'user_1', roles: ['admin'] },
      system: false,
      boundOrganizationId: 'org_1',
      viewSession,
    },
    endpointId: 'child_ep',
    payload: { a: 1 },
    routineContext: { agent: null },
    step: { '~k': 'k1' },
  });
  await waitUntil.mock.calls[0][0];
  expect(mockDispatchDetached).toHaveBeenCalledTimes(1);
  const [url, init] = mockDispatchDetached.mock.calls[0];
  expect(url).toEqual('https://app.test/api/detached/child_ep');
  expect(init.headers.authorization).toEqual('Bearer shhh');
  const body = JSON.parse(init.body);
  expect(serializer.deserialize(body.payload)).toEqual({ a: 1 });
  expect(body.principal).toEqual({
    user: serializer.serialize({ id: 'user_1', roles: ['admin'] }),
    system: false,
    organizationId: 'org_1',
    agent: null,
    viewSession,
  });
});

test('sendDetachedRequest carries a null view session for a dispatcher that has none', async () => {
  vi.stubEnv('CRON_SECRET', 'shhh');
  const waitUntil = vi.fn();
  sendDetachedRequest(
    { logger: { info: vi.fn(), warn: vi.fn() }, origin: 'https://app.test', waitUntil },
    {
      callContext: { user: null, system: true },
      endpointId: 'child_ep',
      payload: {},
      routineContext: {},
      step: { '~k': 'k1' },
    }
  );
  await waitUntil.mock.calls[0][0];
  const body = JSON.parse(mockDispatchDetached.mock.calls[0][1].body);
  expect(body.principal.viewSession).toBeNull();
});
