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

import { afterEach, beforeEach, expect, test, vi } from 'vitest';

// Each test re-imports the module graph, operators included, which a busy
// machine does not always do within the default five seconds.
vi.setConfig({ testTimeout: 30000 });

const originalBetterAuthUrl = process.env.BETTER_AUTH_URL;

function mcpConfig({ configured = true, sources = [] } = {}) {
  return { configured: true, views: { configured, pages: {}, sources } };
}

// The once-per-process log is module state, so each test loads its own copy.
async function load() {
  vi.resetModules();
  const { default: getMcpViews } = await import('./getMcpViews.js');
  const { default: logMcpViews } = await import('./logMcpViews.js');
  return { getMcpViews, logMcpViews };
}

function createLogger() {
  return { info: vi.fn(), warn: vi.fn() };
}

beforeEach(() => {
  process.env.BETTER_AUTH_URL = 'https://app.example.com/';
});

afterEach(() => {
  if (originalBetterAuthUrl === undefined) {
    delete process.env.BETTER_AUTH_URL;
  } else {
    process.env.BETTER_AUTH_URL = originalBetterAuthUrl;
  }
});

test('getMcpViews returns the host, the app origin, the basePath and the resolved sources', async () => {
  const { getMcpViews } = await load();
  const logger = createLogger();
  const views = getMcpViews({
    config: { basePath: '/base' },
    logger,
    mcpConfig: mcpConfig({ sources: ['https://files.example.com', { _secret: 'STATS' }] }),
    mode: 'prod',
    secrets: { STATS: 'https://stats.example.com' },
  });
  expect(views.appOrigin).toEqual('https://app.example.com');
  expect(views.basePath).toEqual('/base');
  expect(views.host.id).toEqual('claude');
  expect(views.sources).toEqual(['https://files.example.com', 'https://stats.example.com']);
  expect(logger.info).not.toHaveBeenCalled();
  expect(logger.warn).not.toHaveBeenCalled();
});

test('getMcpViews returns null without a log line when no tool has a view', async () => {
  const { getMcpViews } = await load();
  const logger = createLogger();
  expect(
    getMcpViews({
      config: {},
      logger,
      mcpConfig: mcpConfig({ configured: false }),
      mode: 'dev',
      secrets: {},
    })
  ).toBe(null);
  expect(logger.info).not.toHaveBeenCalled();
});

test('getMcpViews returns null in the dev server and logs why once', async () => {
  const { getMcpViews } = await load();
  const logger = createLogger();
  const options = { config: {}, logger, mcpConfig: mcpConfig(), mode: 'dev', secrets: {} };
  expect(getMcpViews(options)).toBe(null);
  expect(getMcpViews(options)).toBe(null);
  expect(logger.info.mock.calls).toEqual([
    [
      { event: 'mcp_views_off', reason: 'dev_server' },
      'MCP views are off in the dev server: a view loads the built client, which only a production build has. Tools are served without their views.',
    ],
  ]);
});

test('getMcpViews returns null when the app has no view host and warns once', async () => {
  delete process.env.BETTER_AUTH_URL;
  const { getMcpViews } = await load();
  const logger = createLogger();
  const options = { config: {}, logger, mcpConfig: mcpConfig(), mode: 'prod', secrets: {} };
  expect(getMcpViews(options)).toBe(null);
  expect(getMcpViews(options)).toBe(null);
  expect(logger.warn).toHaveBeenCalledTimes(1);
  expect(logger.warn.mock.calls[0][0]).toEqual({
    event: 'mcp_views_off',
    reason: 'no_canonical_url',
  });
});

test('getMcpViews throws when a viewSources secret is not set', async () => {
  const { getMcpViews } = await load();
  expect(() =>
    getMcpViews({
      config: {},
      logger: createLogger(),
      mcpConfig: mcpConfig({ sources: [{ _secret: 'STATS' }] }),
      mode: 'prod',
      secrets: {},
    })
  ).toThrow(
    'MCP viewSources entry 0 did not resolve to a string. Check the _secret operator reference and that the secret is set.'
  );
});

test('logMcpViews logs the connector URL and the view origin when the app has a view', async () => {
  const { getMcpViews, logMcpViews } = await load();
  const logger = createLogger();
  const options = { config: {}, logger, mcpConfig: mcpConfig(), secrets: {} };
  logMcpViews(options);
  const { host } = getMcpViews({ ...options, mode: 'prod' });
  expect(logger.info.mock.calls).toEqual([
    [
      {
        event: 'mcp_views',
        connectorUrl: 'https://app.example.com/api/mcp',
        viewOrigin: host.origin,
      },
      `MCP views are on. Add the connector with exactly the URL https://app.example.com/api/mcp. Its views run on ${host.origin}.`,
    ],
  ]);
});

test('logMcpViews logs nothing when the app has no view or no mcp block', async () => {
  const { logMcpViews } = await load();
  const logger = createLogger();
  logMcpViews({ config: {}, logger, mcpConfig: mcpConfig({ configured: false }), secrets: {} });
  logMcpViews({
    config: {},
    logger,
    mcpConfig: { configured: false, views: { configured: false, pages: {}, sources: [] } },
    secrets: {},
  });
  expect(logger.info).not.toHaveBeenCalled();
  expect(logger.warn).not.toHaveBeenCalled();
});

test('logMcpViews fails the start when a viewSources secret is not set', async () => {
  const { logMcpViews } = await load();
  expect(() =>
    logMcpViews({
      config: {},
      logger: createLogger(),
      mcpConfig: mcpConfig({ sources: [{ _secret: 'STATS' }] }),
      secrets: {},
    })
  ).toThrow('MCP viewSources entry 0 did not resolve to a string.');
});
