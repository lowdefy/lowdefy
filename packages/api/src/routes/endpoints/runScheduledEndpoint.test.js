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

jest.unstable_mockModule('./runRoutine.js', () => ({
  default: jest.fn(async () => ({ status: 'return', response: 'ok' })),
}));

const { default: runScheduledEndpoint } = await import('./runScheduledEndpoint.js');
const { default: runRoutine } = await import('./runRoutine.js');
const { default: testContext } = await import('../../test/testContext.js');

const logger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

function makeContext(endpoint, { session } = {}) {
  const readConfigFile = jest.fn((path) =>
    path === `api/${endpoint.endpointId}.json` ? endpoint : null
  );
  return testContext({ logger, readConfigFile, session });
}

test('runs a scheduled endpoint and injects the matching schedule payload', async () => {
  const context = makeContext({
    endpointId: 'purge',
    type: 'Api',
    schedules: [
      { cron: '0 6 * * *', payload: { mode: 'full' } },
      { cron: '*/15 * * * *', payload: { mode: 'incremental' } },
    ],
    routine: [],
  });
  const result = await runScheduledEndpoint(context, {
    endpointId: 'purge',
    cron: '*/15 * * * *',
  });
  expect(result.success).toBe(true);
  const [, routineContext] = runRoutine.mock.calls[0];
  expect(routineContext.payload).toEqual({ mode: 'incremental' });
});

test('forces a system context (no user) even if a session is present', async () => {
  const context = makeContext(
    { endpointId: 'purge', type: 'Api', schedules: [{ cron: '0 6 * * *' }], routine: [] },
    { session: { user: { id: 'user_1', roles: ['admin'] } } }
  );
  await runScheduledEndpoint(context, { endpointId: 'purge', cron: '0 6 * * *' });
  expect(context.user).toBe(undefined);
  expect(context.session).toBe(undefined);
});

test('allows an InternalApi endpoint to be scheduled', async () => {
  const context = makeContext({
    endpointId: 'internal',
    type: 'InternalApi',
    schedules: [{ cron: '0 6 * * *' }],
    routine: [],
  });
  const result = await runScheduledEndpoint(context, {
    endpointId: 'internal',
    cron: '0 6 * * *',
  });
  expect(result.success).toBe(true);
});

test('throws when the endpoint declares no schedules', async () => {
  const context = makeContext({ endpointId: 'plain', type: 'Api', routine: [] });
  await expect(
    runScheduledEndpoint(context, { endpointId: 'plain', cron: '0 6 * * *' })
  ).rejects.toThrow('API Endpoint "plain" is not scheduled.');
});

test('throws when no schedule matches the fired cron', async () => {
  const context = makeContext({
    endpointId: 'purge',
    type: 'Api',
    schedules: [{ cron: '0 6 * * *' }],
    routine: [],
  });
  await expect(
    runScheduledEndpoint(context, { endpointId: 'purge', cron: '0 0 * * *' })
  ).rejects.toThrow('No schedule matching cron "0 0 * * *" for API Endpoint "purge".');
});

test('falls back to the single schedule when no cron is provided', async () => {
  const context = makeContext({
    endpointId: 'purge',
    type: 'Api',
    schedules: [{ cron: '0 6 * * *', payload: { mode: 'full' } }],
    routine: [],
  });
  const result = await runScheduledEndpoint(context, { endpointId: 'purge' });
  expect(result.success).toBe(true);
  const [, routineContext] = runRoutine.mock.calls[0];
  expect(routineContext.payload).toEqual({ mode: 'full' });
});
