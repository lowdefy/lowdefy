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

import createAuthStrategies from '../auth/strategies/createAuthStrategies.js';
import createMcpServer from './createMcpServer.js';
import resolveStrategyCaller from '../../context/resolveStrategyCaller.js';
import testContext from '../../test/testContext.js';

// The chain the server middleware runs for a sessionless MCP request:
// createAuthStrategies constructs verifiers from auth.json, the caller
// resolved from request headers is synthesized as session.user, and the
// per-request MCP server authorizes tools against it.

const logger = { debug: jest.fn(), error: jest.fn(), info: jest.fn(), warn: jest.fn() };

// Header-equality stand-in for the plugin verifier - the real digest
// comparison is covered by plugin-next-auth's own tests.
function apiKey({ properties, strategyId }) {
  return async ({ headers }) => {
    const presented = headers.get(properties.headerName);
    const match = properties.keys.find((key) => key.value === presented);
    if (!match) return null;
    return { user: { id: `apiKey:${strategyId}:${match.id}` } };
  };
}

const authJson = {
  configured: true,
  strategies: [
    {
      id: 'partner-access',
      type: 'apiKey',
      properties: {
        headerName: 'X-API-Key',
        keys: [{ id: 'acme', value: { _secret: 'PARTNER_KEY_ACME' } }],
      },
      roles: ['partner'],
      attributes: {},
    },
  ],
};

const files = {
  'mcp.json': { name: 'tools', version: '1.0.0', endpoints: ['health', 'partner-data'], configured: true },
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

async function createContextForHeaders(headers) {
  const strategies = createAuthStrategies({
    appMeta: {},
    authJson,
    logger,
    plugins: { strategies: { apiKey } },
    secrets: { PARTNER_KEY_ACME: 'resolved-key-value' },
  });
  const caller = await resolveStrategyCaller({ headers, logger, strategies });
  return testContext({
    logger,
    readConfigFile: (path) => files[path] ?? null,
    session: caller ? { user: caller } : undefined,
  });
}

async function connectClient(server) {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'test-client', version: '1.0.0' });
  await Promise.all([client.connect(clientTransport), server.connect(serverTransport)]);
  return client;
}

test('anonymous tools/list shows only the public tool', async () => {
  const context = await createContextForHeaders(new Headers({}));
  const client = await connectClient(await createMcpServer({ context }));
  const { tools } = await client.listTools();
  expect(tools.map((tool) => tool.name)).toEqual(['health']);
});

test('tools/list with a valid apiKey header shows the role-gated tool', async () => {
  const context = await createContextForHeaders(
    new Headers({ 'X-API-Key': 'resolved-key-value' })
  );
  const client = await connectClient(await createMcpServer({ context }));
  const { tools } = await client.listTools();
  expect(tools.map((tool) => tool.name)).toEqual(['health', 'partner-data']);
  expect(context.session.user).toEqual({
    id: 'apiKey:partner-access:acme',
    authMethod: 'apiKey',
    strategyId: 'partner-access',
    roles: ['partner'],
    attributes: {},
  });
});

test('tools/call of the gated tool with a bad key returns a 401-shaped error result', async () => {
  const context = await createContextForHeaders(new Headers({ 'X-API-Key': 'wrong' }));
  const client = await connectClient(await createMcpServer({ context }));
  const result = await client.callTool({ name: 'partner-data', arguments: {} });
  expect(result.isError).toBe(true);
  expect(result.content[0].text).toBe(
    'Authentication required for API endpoint "partner-data".'
  );
});
