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

const mockCreateAsMetadataHandler = jest.fn(
  () => async () =>
    new Response(JSON.stringify({ issuer: 'https://app.test.com/api/auth' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
);
jest.unstable_mockModule('@lowdefy/api', () => ({
  createAsMetadataHandler: mockCreateAsMetadataHandler,
}));

jest.unstable_mockModule('./mcpProtectedResourceMetadata.js', () => ({
  default: (c) => c.json({ resource: c.req.param('org') }),
}));

const mockAuthJson = { configured: true };
jest.unstable_mockModule('../../lib/build/auth.js', () => ({
  default: mockAuthJson,
}));

const { default: mountOauthDiscovery } = await import('./mountOauthDiscovery.js');

beforeEach(() => {
  delete mockAuthJson.oauthProvider;
});

test('mountOauthDiscovery mounts nothing when oauthProvider is not configured', async () => {
  const app = new Hono();
  mountOauthDiscovery({ app, auth: { api: {} } });
  const resourceRes = await app.request('/.well-known/oauth-protected-resource/api/mcp/org_1');
  expect(resourceRes.status).toEqual(404);
  const asRes = await app.request('/.well-known/oauth-authorization-server/api/auth');
  expect(asRes.status).toEqual(404);
  expect(mockCreateAsMetadataHandler).not.toHaveBeenCalled();
});

test('mountOauthDiscovery mounts both discovery documents when oauthProvider is configured', async () => {
  mockAuthJson.oauthProvider = { consentPage: '/oauth/consent' };
  const app = new Hono();
  const auth = { api: {} };
  mountOauthDiscovery({ app, auth });
  const resourceRes = await app.request('/.well-known/oauth-protected-resource/api/mcp/org_1');
  expect(resourceRes.status).toEqual(200);
  expect(await resourceRes.json()).toEqual({ resource: 'org_1' });
  const asRes = await app.request('/.well-known/oauth-authorization-server/api/auth');
  expect(asRes.status).toEqual(200);
  expect(await asRes.json()).toEqual({ issuer: 'https://app.test.com/api/auth' });
  expect(mockCreateAsMetadataHandler).toHaveBeenCalledWith({ auth });
});

test('mountOauthDiscovery serves only the static resource document without an auth instance', async () => {
  mockAuthJson.oauthProvider = { consentPage: '/oauth/consent' };
  const app = new Hono();
  mountOauthDiscovery({ app, auth: null });
  const resourceRes = await app.request('/.well-known/oauth-protected-resource/api/mcp/org_1');
  expect(resourceRes.status).toEqual(200);
  const asRes = await app.request('/.well-known/oauth-authorization-server/api/auth');
  expect(asRes.status).toEqual(404);
  expect(mockCreateAsMetadataHandler).not.toHaveBeenCalled();
});
