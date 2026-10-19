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

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { Hono } from 'hono';
import { jest } from '@jest/globals';

// A phone shell calls /api/agent with its session as a bearer, the x-lowdefy-shell header and no
// cookie. The route sits behind the same apiContext middleware as /api/request and
// /api/endpoints, so the caller is resolved by the one resolver (resolveAuthentication) from the
// request's own headers, on its general (not MCP) branch. resolveAuthentication's bearer branch
// itself is covered in @lowdefy/api (resolveAuthentication.test.js, bearerSession.mongodb.test.js);
// this pins that the agent route reaches it and runs as the caller it resolves.

const sessions = { 'phone-session-token': { id: 'u-phone', roles: ['member'] } };

const mockResolveAuthentication = jest.fn(async (context, { headers }) => {
  const authorization = headers.get('authorization') ?? '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : null;
  context.user = sessions[token] ?? null;
});
const mockCallAgent = jest.fn(async () => ({
  response: new Response('data: {"type":"start"}\n\ndata: [DONE]\n\n'),
}));

jest.unstable_mockModule('@lowdefy/api', () => ({
  callAgent: mockCallAgent,
  createApiContext: jest.fn(),
  createRequestSignal: jest.fn(({ clientSignal }) => clientSignal),
  ensureMcpOauthResource: jest.fn(async () => {}),
  parseRequestBody: ({ text }) => JSON.parse(text),
  resolveAuthentication: mockResolveAuthentication,
  resolvePinnedOrganization: jest.fn(async () => {}),
  resolveTenantPreflight: jest.fn(async () => {}),
}));
jest.unstable_mockModule('../../lib/build/appMeta.js', () => ({ default: {} }));
jest.unstable_mockModule('../../lib/build/config.js', () => ({ default: {} }));
jest.unstable_mockModule('../../lib/build/i18n.js', () => ({ default: {} }));
jest.unstable_mockModule('../../lib/build/logger.js', () => ({ default: { sentry: {} } }));
jest.unstable_mockModule('../../lib/server/log/createHandleError.js', () => ({
  default: jest.fn(() => jest.fn()),
}));
jest.unstable_mockModule('../../lib/server/log/createLogger.js', () => ({
  default: jest.fn(() => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  })),
}));
jest.unstable_mockModule('../../lib/server/fileCache.js', () => ({ default: {} }));
jest.unstable_mockModule('../../lib/server/auth/getAuth.js', () => ({
  default: jest.fn(() => ({ api: {} })),
}));
jest.unstable_mockModule('../../lib/server/auth/getStrategies.js', () => ({
  default: jest.fn(() => null),
}));
jest.unstable_mockModule('../../lib/server/log/logRequest.js', () => ({ default: jest.fn() }));
jest.unstable_mockModule('../../lib/server/sentry/setSentryUser.js', () => ({
  default: jest.fn(),
}));

// apiContext statically imports the app build's plugin artifacts, which only exist in a built app
// (build/** is gitignored). The same fixtures as middleware/apiContext.test.mjs.
const dirname = path.dirname(fileURLToPath(import.meta.url));
const pluginsDir = path.resolve(dirname, '../../build/plugins');
const fixtures = [
  'agents.js',
  'connections.js',
  'notifications.js',
  path.join('operators', 'server.js'),
  path.join('operators', 'serverJsMap.js'),
  'steps.js',
  'websockets.js',
].map((file) => path.join(pluginsDir, file));

const createdFixtures = [];
fixtures.forEach((absolutePath) => {
  if (!fs.existsSync(absolutePath)) {
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    fs.writeFileSync(
      absolutePath,
      'export default {};\nexport const interpolateProperties = () => {};\nexport const renderEmail = () => {};\n'
    );
    createdFixtures.push(absolutePath);
  }
});
fixtures.forEach((absolutePath) => {
  jest.unstable_mockModule(absolutePath, () => ({
    default: {},
    interpolateProperties: () => {},
    renderEmail: () => {},
  }));
});

afterAll(() => {
  createdFixtures.forEach((absolutePath) => fs.rmSync(absolutePath, { force: true }));
});

const { default: apiContext } = await import('../middleware/apiContext.js');
const { default: agentHandler } = await import('./agent.js');

function createApp() {
  const app = new Hono();
  app.use('/api/*', apiContext());
  app.all('/api/agent/*', agentHandler);
  return app;
}

function postChat(headers) {
  return createApp().request('/api/agent/atlas-chat/atlas?conversationId=c1', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify({ messages: [], sharedState: { now: 'today' } }),
  });
}

beforeEach(() => {
  mockResolveAuthentication.mockClear();
  mockCallAgent.mockClear();
});

test('a shell chat call with a bearer session runs the agent as that caller', async () => {
  const res = await postChat({
    authorization: 'Bearer phone-session-token',
    'x-lowdefy-shell': '7.4.0',
  });
  expect(res.status).toEqual(200);
  expect(res.headers.get('content-type')).toEqual('text/event-stream');
  expect(await res.text()).toEqual('data: {"type":"start"}\n\ndata: [DONE]\n\n');
  expect(mockCallAgent).toHaveBeenCalledTimes(1);
  const [context, params] = mockCallAgent.mock.calls[0];
  expect(context.user).toEqual({ id: 'u-phone', roles: ['member'] });
  expect(params).toEqual({
    agentId: 'atlas',
    pageId: 'atlas-chat',
    messages: [],
    conversationId: 'c1',
    sharedState: { now: 'today' },
    sharedStateReadOnly: undefined,
    pathParams: undefined,
    urlQuery: undefined,
  });
});

test('the agent route resolves its caller through the general branch from the raw headers', async () => {
  await postChat({ authorization: 'Bearer phone-session-token', 'x-lowdefy-shell': '7.4.0' });
  expect(mockResolveAuthentication).toHaveBeenCalledTimes(1);
  const [, options] = mockResolveAuthentication.mock.calls[0];
  expect(options.mcp).toBe(false);
  expect(options.headers.get('authorization')).toEqual('Bearer phone-session-token');
  expect(options.headers.get('cookie')).toBeNull();
});

test('a shell chat call with an unknown bearer runs the agent signed out', async () => {
  await postChat({ authorization: 'Bearer ended-session', 'x-lowdefy-shell': '7.4.0' });
  const [context] = mockCallAgent.mock.calls[0];
  expect(context.user).toBeNull();
});
