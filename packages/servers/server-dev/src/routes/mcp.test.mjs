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

// The real URI helpers drive the challenge strings, so the header assertions
// below exercise the actual BETTER_AUTH_URL derivation - only createMcpServer
// is stubbed out.
const uriHelpers = await import('@lowdefy/api/routes/mcp/getMcpUri.js');

const mockCreateMcpServer = jest.fn();
jest.unstable_mockModule('@lowdefy/api', () => ({
  ...uriHelpers,
  createMcpServer: mockCreateMcpServer,
}));

jest.unstable_mockModule('@hono/mcp', () => ({
  StreamableHTTPTransport: class {
    handleRequest() {
      return new Response(JSON.stringify({ served: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }
  },
}));

const mockAuthJson = { configured: true, oauthProvider: { consentPage: '/oauth/consent' } };
jest.unstable_mockModule('../../lib/build/auth.js', () => ({
  default: mockAuthJson,
}));

const { default: mcpHandler } = await import('./mcp.js');

const originalBetterAuthUrl = process.env.BETTER_AUTH_URL;

const mockReadConfigFile = jest.fn();

let contextOverrides;

function createApp() {
  const app = new Hono();
  app.use('*', async (c, next) => {
    c.set('lowdefyContext', {
      config: { basePath: '' },
      logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
      readConfigFile: mockReadConfigFile,
      ...contextOverrides,
    });
    await next();
  });
  app.all('/api/mcp', mcpHandler);
  return app;
}

beforeEach(() => {
  process.env.BETTER_AUTH_URL = 'https://app.test.com';
  mockAuthJson.oauthProvider = { consentPage: '/oauth/consent' };
  contextOverrides = {};
  mockReadConfigFile.mockReset();
  mockCreateMcpServer.mockReset();
  mockCreateMcpServer.mockResolvedValue({ connect: jest.fn() });
  mockReadConfigFile.mockResolvedValue({ configured: true, hasPublicTool: true, endpoints: [] });
});

afterAll(() => {
  if (originalBetterAuthUrl === undefined) {
    delete process.env.BETTER_AUTH_URL;
  } else {
    process.env.BETTER_AUTH_URL = originalBetterAuthUrl;
  }
});

test('mcpHandler returns 404 when mcp is not configured', async () => {
  mockReadConfigFile.mockResolvedValue({ configured: false });
  const res = await createApp().request('/api/mcp', { method: 'POST' });
  expect(res.status).toEqual(404);
  expect(await res.json()).toEqual({ error: 'MCP is not configured.' });
  expect(mockCreateMcpServer).not.toHaveBeenCalled();
});

test('mcpHandler challenges an invalid token with the resource metadata pointer', async () => {
  contextOverrides.mcpAuth = { tokenStatus: 'invalid', parseableJwt: true };
  const res = await createApp().request('/api/mcp', { method: 'POST' });
  expect(res.status).toEqual(401);
  expect(res.headers.get('WWW-Authenticate')).toEqual(
    'Bearer resource_metadata="https://app.test.com/.well-known/oauth-protected-resource/api/mcp"'
  );
  expect(mockCreateMcpServer).not.toHaveBeenCalled();
});

test('mcpHandler extends the challenge with invalid_token when the bearer is not a JWT', async () => {
  contextOverrides.mcpAuth = { tokenStatus: 'invalid', parseableJwt: false };
  const res = await createApp().request('/api/mcp', { method: 'POST' });
  expect(res.status).toEqual(401);
  expect(res.headers.get('WWW-Authenticate')).toEqual(
    'Bearer error="invalid_token", error_description="The access token is not a JWT. Connect with a client that sends the RFC 8707 resource parameter.", resource_metadata="https://app.test.com/.well-known/oauth-protected-resource/api/mcp"'
  );
});

test('mcpHandler tells a revoked grant to reconnect and choose an organization', async () => {
  contextOverrides.mcpAuth = {
    clientId: 'client_1',
    organizationId: 'org_1',
    tokenStatus: 'invalid',
    parseableJwt: true,
    revoked: true,
  };
  const res = await createApp().request('/api/mcp', { method: 'POST' });
  expect(res.status).toEqual(401);
  expect(res.headers.get('WWW-Authenticate')).toEqual(
    'Bearer error="invalid_token", error_description="This connection was disconnected. Reconnect to choose the organization to work in.", resource_metadata="https://app.test.com/.well-known/oauth-protected-resource/api/mcp"'
  );
  expect(mockCreateMcpServer).not.toHaveBeenCalled();
});

test('mcpHandler challenges an anonymous request when the surface has no public tool', async () => {
  mockReadConfigFile.mockResolvedValue({ configured: true, hasPublicTool: false, endpoints: [] });
  contextOverrides.mcpAuth = { tokenStatus: 'none', parseableJwt: true };
  const res = await createApp().request('/api/mcp', { method: 'POST' });
  expect(res.status).toEqual(401);
  expect(res.headers.get('WWW-Authenticate')).toEqual(
    'Bearer resource_metadata="https://app.test.com/.well-known/oauth-protected-resource/api/mcp"'
  );
});

test('mcpHandler serves an anonymous request when the surface has a public tool', async () => {
  contextOverrides.mcpAuth = { tokenStatus: 'none', parseableJwt: true };
  const res = await createApp().request('/api/mcp', { method: 'POST' });
  expect(res.status).toEqual(200);
  expect(await res.json()).toEqual({ served: true });
});

test('mcpHandler serves a valid-token request and never challenges past the boundary', async () => {
  mockReadConfigFile.mockResolvedValue({ configured: true, hasPublicTool: false, endpoints: [] });
  contextOverrides.mcpAuth = {
    tokenStatus: 'valid',
    parseableJwt: true,
    grantedScopes: ['mcp:read'],
  };
  const res = await createApp().request('/api/mcp', { method: 'POST' });
  expect(res.status).toEqual(200);
  expect(await res.json()).toEqual({ served: true });
});

test('mcpHandler refuses a foreign Origin with a 403', async () => {
  contextOverrides.mcpAuth = { tokenStatus: 'none', parseableJwt: true };
  const res = await createApp().request('/api/mcp', {
    method: 'POST',
    headers: { Origin: 'https://evil.test' },
  });
  expect(res.status).toEqual(403);
  expect(await res.json()).toEqual({ error: 'Origin not allowed.' });
  expect(mockCreateMcpServer).not.toHaveBeenCalled();
});

test('mcpHandler accepts the pinned canonical origin', async () => {
  contextOverrides.mcpAuth = { tokenStatus: 'none', parseableJwt: true };
  const res = await createApp().request('/api/mcp', {
    method: 'POST',
    headers: { Origin: 'https://app.test.com' },
  });
  expect(res.status).toEqual(200);
});

test('mcpHandler accepts an origin registered on BetterAuth trustedOrigins', async () => {
  contextOverrides.mcpAuth = { tokenStatus: 'none', parseableJwt: true };
  contextOverrides.auth = { options: { trustedOrigins: ['https://studio.test.com'] } };
  const res = await createApp().request('/api/mcp', {
    method: 'POST',
    headers: { Origin: 'https://studio.test.com' },
  });
  expect(res.status).toEqual(200);
});

test('mcpHandler serves openly with no envelope when oauthProvider is not configured', async () => {
  delete mockAuthJson.oauthProvider;
  contextOverrides.mcpAuth = { tokenStatus: 'invalid', parseableJwt: false };
  const res = await createApp().request('/api/mcp', {
    method: 'POST',
    headers: { Origin: 'https://evil.test' },
  });
  expect(res.status).toEqual(200);
  expect(await res.json()).toEqual({ served: true });
});
