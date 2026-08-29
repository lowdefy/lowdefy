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
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { exportJWK, generateKeyPair, SignJWT } from 'jose';

import createMcpServer from './createMcpServer.js';
import resolveAuthentication from '../../context/resolveAuthentication.js';
import testContext from '../../test/testContext.js';

// The credential-model integration: the MCP surface accepts exactly one
// credential kind - an access token this app's own authorization server
// minted for the MCP resource, carrying the organization the member chose at
// authorization as its organization_id claim. A session cookie and an
// apiKey/jwt strategy credential authenticate elsewhere but resolve anonymous
// here, which the per-request MCP server then limits to public tools.

const logger = { debug: jest.fn(), error: jest.fn(), info: jest.fn(), warn: jest.fn() };

const issuer = 'https://app.test.com/api/auth';
const resourceUri = 'https://app.test.com/api/mcp';

const files = {
  'mcp.json': {
    name: 'tools',
    version: '1.0.0',
    configured: true,
    hasPublicTool: true,
    endpoints: [
      { id: 'health', scope: 'mcp:read' },
      { id: 'partner-data', scope: 'mcp:read' },
    ],
  },
  'api/health.json': {
    endpointId: 'health',
    type: 'Api',
    auth: { public: true },
    description: 'Health check.',
    payloadSchema: { type: 'object' },
    routine: { ':return': { ok: true } },
  },
  'api/partner-data.json': {
    endpointId: 'partner-data',
    type: 'Api',
    auth: { public: false, roles: ['partner'] },
    description: 'Partner data.',
    payloadSchema: { type: 'object' },
    routine: { ':return': { data: 'partner-report' } },
  },
};

const originalBetterAuthUrl = process.env.BETTER_AUTH_URL;

let privateKey;
let foreignPrivateKey;
let jwksRows;

beforeAll(async () => {
  const keyPair = await generateKeyPair('EdDSA');
  privateKey = keyPair.privateKey;
  const foreignKeyPair = await generateKeyPair('EdDSA');
  foreignPrivateKey = foreignKeyPair.privateKey;
  jwksRows = [
    {
      id: 'kid_1',
      publicKey: JSON.stringify(await exportJWK(keyPair.publicKey)),
      privateKey: 'encrypted-and-never-read',
      createdAt: new Date(),
      alg: 'EdDSA',
    },
  ];
});

beforeEach(() => {
  jest.clearAllMocks();
  process.env.BETTER_AUTH_URL = 'https://app.test.com';
});

afterAll(() => {
  if (originalBetterAuthUrl === undefined) {
    delete process.env.BETTER_AUTH_URL;
  } else {
    process.env.BETTER_AUTH_URL = originalBetterAuthUrl;
  }
});

function mockAuth({ consent = { id: 'consent_1' }, member, session, user } = {}) {
  const findOne = jest.fn(async ({ model }) => {
    if (model === 'user') {
      return user ?? null;
    }
    if (model === 'member') {
      return member ?? null;
    }
    if (model === 'oauthConsent') {
      return consent;
    }
    return null;
  });
  const findMany = jest.fn(async ({ model }) => (model === 'jwks' ? jwksRows : []));
  const count = jest.fn().mockResolvedValue(0);
  return {
    api: { getSession: jest.fn().mockResolvedValue(session ?? null) },
    $context: Promise.resolve({ adapter: { count, findMany, findOne } }),
  };
}

async function mintToken({
  key = privateKey,
  organizationId = 'org_1',
  scope = 'mcp:read',
  sub = 'user_1',
} = {}) {
  return new SignJWT({
    scope,
    organization_id: organizationId,
    client_id: 'client_1',
    azp: 'client_1',
  })
    .setProtectedHeader({ alg: 'EdDSA', kid: 'kid_1' })
    .setIssuedAt()
    .setExpirationTime('5m')
    .setIssuer(issuer)
    .setAudience(resourceUri)
    .setSubject(sub)
    .sign(key);
}

// The chain the /api/mcp route runs: resolveAuthentication on its MCP branch
// writes context.user and context.mcpAuth, and the per-request MCP server is
// built over that resolved context.
async function createMcpContext({ auth, headers, strategies = [] }) {
  const authContext = { config: {}, logger };
  await resolveAuthentication(authContext, {
    auth,
    headers,
    strategies,
    mcp: true,
  });
  const context = testContext({
    logger,
    readConfigFile: (path) => files[path] ?? null,
    user: authContext.user,
  });
  context.mcpAuth = authContext.mcpAuth;
  return context;
}

async function connectClient(server) {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'test-client', version: '1.0.0' });
  await Promise.all([client.connect(clientTransport), server.connect(serverTransport)]);
  return client;
}

test('an anonymous request lists only the public tool', async () => {
  const auth = mockAuth();
  const context = await createMcpContext({ auth, headers: new Headers({}) });
  const client = await connectClient(await createMcpServer({ context }));

  const { tools } = await client.listTools();
  expect(tools.map((tool) => tool.name)).toEqual(['health']);
  expect(context.user).toBe(null);
});

test('a session cookie does not authenticate the MCP surface', async () => {
  const auth = mockAuth({
    session: {
      user: { id: 'user_1' },
      session: { id: 'sess_1', activeOrganizationId: 'org_1' },
    },
    member: { id: 'member_1', role: 'member', appRoles: ['partner'] },
  });
  const context = await createMcpContext({
    auth,
    headers: new Headers({ cookie: 'better-auth.session_token=abc' }),
  });
  const client = await connectClient(await createMcpServer({ context }));

  expect(context.user).toBe(null);
  expect(auth.api.getSession).not.toHaveBeenCalled();

  const { tools } = await client.listTools();
  expect(tools.map((tool) => tool.name)).toEqual(['health']);

  const result = await client.callTool({ name: 'partner-data', arguments: {} });
  expect(result.isError).toBe(true);
  expect(result.content).toEqual([{ type: 'text', text: 'Unknown tool "partner-data".' }]);
});

test('an apiKey strategy credential does not authenticate the MCP surface', async () => {
  const auth = mockAuth({
    user: { id: 'user_1' },
    member: { id: 'member_1', role: 'member', appRoles: ['partner'] },
  });
  const strategy = {
    id: 'partner-access',
    type: 'apiKey',
    roles: ['partner'],
    attributes: {},
    verify: jest.fn().mockResolvedValue({ user: { id: 'apiKey:partner-access:acme' } }),
  };
  const context = await createMcpContext({
    auth,
    headers: new Headers({ 'X-API-Key': 'valid-partner-key' }),
    strategies: [strategy],
  });
  const client = await connectClient(await createMcpServer({ context }));

  expect(context.user).toBe(null);
  expect(strategy.verify).not.toHaveBeenCalled();
  expect(context.mcpAuth.tokenStatus).toBe('none');

  const { tools } = await client.listTools();
  expect(tools.map((tool) => tool.name)).toEqual(['health']);
});

test('a jwt strategy bearer not minted by the app AS resolves invalid and gets public tools only', async () => {
  const auth = mockAuth({
    user: { id: 'user_1' },
    member: { id: 'member_1', role: 'member', appRoles: ['partner'] },
  });
  const foreignToken = await mintToken({ key: foreignPrivateKey });
  const context = await createMcpContext({
    auth,
    headers: new Headers({ authorization: `Bearer ${foreignToken}` }),
  });
  const client = await connectClient(await createMcpServer({ context }));

  expect(context.user).toBe(null);
  expect(context.mcpAuth.tokenStatus).toBe('invalid');

  const { tools } = await client.listTools();
  expect(tools.map((tool) => tool.name)).toEqual(['health']);

  const result = await client.callTool({ name: 'partner-data', arguments: {} });
  expect(result.isError).toBe(true);
  expect(result.content).toEqual([{ type: 'text', text: 'Unknown tool "partner-data".' }]);
});

test('an app-AS bearer resolves the member and serves the gated tool', async () => {
  const auth = mockAuth({
    user: { id: 'user_1', email: 'user@example.com' },
    member: { id: 'member_1', role: 'member', appRoles: ['partner'] },
  });
  const token = await mintToken({ scope: 'mcp:read' });
  const context = await createMcpContext({
    auth,
    headers: new Headers({ authorization: `Bearer ${token}` }),
  });
  const client = await connectClient(await createMcpServer({ context }));

  expect(context.user).toMatchObject({
    id: 'user_1',
    roles: ['partner'],
    organization_id: 'org_1',
    auth_method: 'mcp',
  });
  expect(context.mcpAuth).toEqual({
    clientId: 'client_1',
    organizationId: 'org_1',
    tokenStatus: 'valid',
    parseableJwt: true,
    grantedScopes: ['mcp:read'],
  });

  const { tools } = await client.listTools();
  expect(tools.map((tool) => tool.name)).toEqual(['health', 'partner-data']);

  const result = await client.callTool({ name: 'partner-data', arguments: {} });
  expect(result.isError).toBeFalsy();
  expect(JSON.parse(result.content[0].text)).toEqual({ data: 'partner-report' });
});

test('an app-AS bearer whose grant was revoked resolves invalid and gets public tools only', async () => {
  const auth = mockAuth({
    consent: null,
    user: { id: 'user_1', email: 'user@example.com' },
    member: { id: 'member_1', role: 'member', appRoles: ['partner'] },
  });
  const token = await mintToken({ scope: 'mcp:read' });
  const context = await createMcpContext({
    auth,
    headers: new Headers({ authorization: `Bearer ${token}` }),
  });
  const client = await connectClient(await createMcpServer({ context }));

  expect(context.user).toBe(null);
  expect(context.mcpAuth).toEqual({
    clientId: 'client_1',
    organizationId: 'org_1',
    tokenStatus: 'invalid',
    parseableJwt: true,
    revoked: true,
  });

  const { tools } = await client.listTools();
  expect(tools.map((tool) => tool.name)).toEqual(['health']);
});

test('the organization a bearer acts in is its claim - the same subject resolves in another org', async () => {
  const auth = mockAuth({
    user: { id: 'user_1', email: 'user@example.com' },
    member: { id: 'member_2', role: 'member', appRoles: ['partner'] },
  });
  const token = await mintToken({ organizationId: 'org_2' });
  const context = await createMcpContext({
    auth,
    headers: new Headers({ authorization: `Bearer ${token}` }),
  });

  expect(context.user).toMatchObject({ id: 'user_1', organization_id: 'org_2' });
  expect(context.mcpAuth.organizationId).toBe('org_2');
});
