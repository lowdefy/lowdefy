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

const { default: forwardScheduledEndpoint } = await import('./forwardScheduledEndpoint.js');
const { default: testContext } = await import('../../test/testContext.js');

const logger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

const config = {
  cron: {
    environments: {
      production: {},
      staging: { url: 'https://staging.example.com/', secret: 'STAGING_CRON_SECRET' },
      develop: {
        url: 'https://develop.example.com',
        secret: 'DEVELOP_CRON_SECRET',
        enabled: false,
      },
    },
  },
  vercel: { maxDuration: 120 },
};

const endpoint = {
  endpointId: 'jobs/purge',
  type: 'InternalApi',
  schedules: {
    production: [{ cron: '*/5 * * * *' }],
    staging: [{ cron: '0 * * * *' }],
    develop: [{ cron: '0 * * * *' }],
  },
  routine: [],
};

function makeContext({ secrets = { STAGING_CRON_SECRET: 'staging-secret' }, waitUntil } = {}) {
  const readConfigFile = jest.fn((path) => (path === 'api/jobs/purge.json' ? endpoint : null));
  const context = testContext({ logger, readConfigFile, config, secrets });
  context.waitUntil = waitUntil;
  return context;
}

let fetchMock;

beforeEach(() => {
  jest.clearAllMocks();
  fetchMock = jest.fn(async () => ({
    ok: true,
    status: 200,
    arrayBuffer: async () => new ArrayBuffer(0),
  }));
  globalThis.fetch = fetchMock;
});

test('acknowledges immediately and pings the environment cron route with its secret', async () => {
  const promises = [];
  const context = makeContext({ waitUntil: (promise) => promises.push(promise) });
  const result = await forwardScheduledEndpoint(context, {
    environment: 'staging',
    endpointId: 'jobs/purge',
    cron: '0 * * * *',
  });
  expect(result).toEqual({
    error: null,
    response: { accepted: true, environment: 'staging', endpointId: 'jobs/purge' },
    status: 'accepted',
    success: true,
  });
  expect(fetchMock).toHaveBeenCalledTimes(1);
  const [url, options] = fetchMock.mock.calls[0];
  expect(url).toBe('https://staging.example.com/api/cron/jobs/purge');
  expect(options.method).toBe('GET');
  expect(options.headers).toEqual({
    authorization: 'Bearer staging-secret',
    'x-vercel-cron-schedule': '0 * * * *',
    'x-lowdefy-cron-environment': 'staging',
  });
  expect(options.signal).toBeInstanceOf(AbortSignal);
  expect(promises).toHaveLength(1);
  await promises[0];
  expect(logger.info).toHaveBeenCalledWith(
    expect.objectContaining({ event: 'forward_scheduled_endpoint_done', status: 200 })
  );
});

test('logs a non-2xx answer from the environment as a failure without failing the trigger', async () => {
  fetchMock.mockImplementation(async () => ({
    ok: false,
    status: 500,
    arrayBuffer: async () => new ArrayBuffer(0),
  }));
  const promises = [];
  const context = makeContext({ waitUntil: (promise) => promises.push(promise) });
  const result = await forwardScheduledEndpoint(context, {
    environment: 'staging',
    endpointId: 'jobs/purge',
    cron: '0 * * * *',
  });
  expect(result.success).toBe(true);
  await promises[0];
  expect(logger.error).toHaveBeenCalledWith(
    expect.objectContaining({ event: 'forward_scheduled_endpoint_failed' }),
    'Forwarded cron for environment "staging" at https://staging.example.com/api/cron/jobs/purge responded 500.'
  );
});

test('throws when the environment is not declared', async () => {
  const context = makeContext();
  await expect(
    forwardScheduledEndpoint(context, {
      environment: 'qa',
      endpointId: 'jobs/purge',
      cron: '0 * * * *',
    })
  ).rejects.toThrow('Cron environment "qa" is not declared in lowdefy.config.cron.environments.');
  expect(fetchMock).not.toHaveBeenCalled();
});

test('throws when asked to forward to the environment that runs the crons', async () => {
  const context = makeContext();
  await expect(
    forwardScheduledEndpoint(context, {
      environment: 'production',
      endpointId: 'jobs/purge',
      cron: '*/5 * * * *',
    })
  ).rejects.toThrow('Cron environment "production" has no url to forward to');
});

test('throws when the environment is disabled', async () => {
  const context = makeContext({ secrets: { DEVELOP_CRON_SECRET: 'x' } });
  await expect(
    forwardScheduledEndpoint(context, {
      environment: 'develop',
      endpointId: 'jobs/purge',
      cron: '0 * * * *',
    })
  ).rejects.toThrow('Cron environment "develop" is disabled.');
});

test('fails closed when the environment secret is not set', async () => {
  const context = makeContext({ secrets: {} });
  await expect(
    forwardScheduledEndpoint(context, {
      environment: 'staging',
      endpointId: 'jobs/purge',
      cron: '0 * * * *',
    })
  ).rejects.toThrow(
    'Secret "STAGING_CRON_SECRET" holding the CRON_SECRET of cron environment "staging" is not set. Set the LOWDEFY_SECRET_STAGING_CRON_SECRET environment variable on this deployment.'
  );
  expect(fetchMock).not.toHaveBeenCalled();
});

test('throws when the endpoint does not declare the fired cron for the environment', async () => {
  const context = makeContext();
  await expect(
    forwardScheduledEndpoint(context, {
      environment: 'staging',
      endpointId: 'jobs/purge',
      cron: '*/5 * * * *',
    })
  ).rejects.toThrow(
    'No schedule matching cron "*/5 * * * *" for API Endpoint "jobs/purge" for environment "staging".'
  );
  expect(fetchMock).not.toHaveBeenCalled();
});

test('throws when the endpoint does not exist', async () => {
  const context = makeContext();
  await expect(
    forwardScheduledEndpoint(context, {
      environment: 'staging',
      endpointId: 'missing',
      cron: '0 * * * *',
    })
  ).rejects.toThrow('API Endpoint "missing" does not exist.');
});
