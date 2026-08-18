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

import { Hono } from 'hono';
import { jest } from '@jest/globals';

jest.unstable_mockModule('../../lib/build/config.js', () => ({
  default: { basePath: '' },
}));

const { default: mcpProtectedResourceMetadataHandler } = await import(
  './mcpProtectedResourceMetadata.js'
);

const originalBetterAuthUrl = process.env.BETTER_AUTH_URL;

function createApp() {
  const app = new Hono();
  app.get(
    '/.well-known/oauth-protected-resource/api/mcp/:org',
    mcpProtectedResourceMetadataHandler
  );
  return app;
}

beforeEach(() => {
  process.env.BETTER_AUTH_URL = 'https://app.test.com';
});

afterAll(() => {
  if (originalBetterAuthUrl === undefined) {
    delete process.env.BETTER_AUTH_URL;
  } else {
    process.env.BETTER_AUTH_URL = originalBetterAuthUrl;
  }
});

test('metadata handler serves the static template for an org', async () => {
  const res = await createApp().request('/.well-known/oauth-protected-resource/api/mcp/org_1');
  expect(res.status).toEqual(200);
  expect(await res.json()).toEqual({
    resource: 'https://app.test.com/api/mcp/org_1',
    authorization_servers: ['https://app.test.com/api/auth'],
    scopes_supported: ['mcp:read', 'mcp:write'],
    bearer_methods_supported: ['header'],
  });
});

test('metadata handler serves the same-shaped document for a fabricated org id', async () => {
  const app = createApp();
  const realRes = await app.request('/.well-known/oauth-protected-resource/api/mcp/org_1');
  const fakeRes = await app.request('/.well-known/oauth-protected-resource/api/mcp/no_such_org');
  expect(fakeRes.status).toEqual(200);
  const real = await realRes.json();
  const fake = await fakeRes.json();
  expect(fake).toEqual({
    ...real,
    resource: 'https://app.test.com/api/mcp/no_such_org',
  });
});

test('metadata handler returns 404 for a malformed org segment', async () => {
  const res = await createApp().request('/.well-known/oauth-protected-resource/api/mcp/a%20b');
  expect(res.status).toEqual(404);
  expect(await res.json()).toEqual({ error: 'Not found.' });
});
