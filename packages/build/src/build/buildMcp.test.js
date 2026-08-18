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

import buildMcp from './buildMcp.js';
import testContext from '../test-utils/testContext.js';

const publicEndpoint = {
  id: 'endpoint:get-customer',
  endpointId: 'get-customer',
  type: 'Api',
  description: 'Look up a customer.',
  payloadSchema: { type: 'object' },
  auth: { public: true },
};

const protectedEndpoint = {
  id: 'endpoint:create-order',
  endpointId: 'create-order',
  type: 'Api',
  description: 'Create an order.',
  payloadSchema: { type: 'object' },
  auth: { public: false },
};

const oauthProviderAuth = { oauthProvider: { consentPage: '/oauth/consent' } };

test('buildMcp writes unconfigured defaults when no mcp block is defined', () => {
  const context = testContext();
  const components = {};
  const res = buildMcp({ components, context });
  expect(res.mcp).toEqual({
    name: 'lowdefy',
    version: '1.0.0',
    endpoints: [],
    configured: false,
    hasPublicTool: false,
  });
});

test('buildMcp keeps explicit name and version and sets configured', () => {
  const context = testContext();
  const components = {
    api: [publicEndpoint],
    mcp: {
      name: 'my-tools',
      version: '2.0.0',
      endpoints: [{ id: 'get-customer', scope: 'mcp:read' }],
    },
  };
  const res = buildMcp({ components, context });
  expect(res.mcp).toEqual({
    name: 'my-tools',
    version: '2.0.0',
    endpoints: [{ id: 'get-customer', scope: 'mcp:read' }],
    configured: true,
    hasPublicTool: true,
  });
});

test('buildMcp builds a public tool set without auth.oauthProvider', () => {
  const context = testContext();
  const components = {
    api: [publicEndpoint],
    mcp: { endpoints: [{ id: 'get-customer', scope: 'mcp:read' }] },
  };
  const res = buildMcp({ components, context });
  expect(res.mcp.configured).toBe(true);
  expect(res.mcp.hasPublicTool).toBe(true);
});

test('buildMcp throws naming the endpoint when a protected tool has no auth.oauthProvider', () => {
  const context = testContext();
  const components = {
    api: [protectedEndpoint],
    mcp: { endpoints: [{ id: 'create-order', scope: 'mcp:write' }] },
  };
  expect(() => buildMcp({ components, context })).toThrow(
    'MCP endpoint "create-order" is protected or role-gated, but "auth.oauthProvider" is not configured. Protected MCP tools require the app\'s OAuth authorization server, or make the endpoint public.'
  );
});

test('buildMcp throws when a role-gated tool has no auth.oauthProvider', () => {
  const context = testContext();
  const components = {
    api: [{ ...protectedEndpoint, auth: { public: false, roles: ['admin'] } }],
    mcp: { endpoints: [{ id: 'create-order', scope: 'mcp:write' }] },
  };
  expect(() => buildMcp({ components, context })).toThrow(
    'MCP endpoint "create-order" is protected or role-gated, but "auth.oauthProvider" is not configured.'
  );
});

test('buildMcp builds a protected tool when auth.oauthProvider is configured', () => {
  const context = testContext();
  const components = {
    auth: oauthProviderAuth,
    api: [protectedEndpoint],
    mcp: { endpoints: [{ id: 'create-order', scope: 'mcp:write' }] },
  };
  const res = buildMcp({ components, context });
  expect(res.mcp.configured).toBe(true);
  expect(res.mcp.hasPublicTool).toBe(false);
});

test('buildMcp sets hasPublicTool true for a mixed public and protected tool set', () => {
  const context = testContext();
  const components = {
    auth: oauthProviderAuth,
    api: [publicEndpoint, protectedEndpoint],
    mcp: {
      endpoints: [
        { id: 'get-customer', scope: 'mcp:read' },
        { id: 'create-order', scope: 'mcp:write' },
      ],
    },
  };
  const res = buildMcp({ components, context });
  expect(res.mcp.hasPublicTool).toBe(true);
});

test('buildMcp throws when an endpoint entry is a legacy string', () => {
  const context = testContext();
  const components = {
    api: [publicEndpoint],
    mcp: { endpoints: ['get-customer'] },
  };
  expect(() => buildMcp({ components, context })).toThrow(
    'MCP "endpoints" items should be objects with "id" and "scope" properties.'
  );
});

test('buildMcp throws when an endpoint entry has no scope', () => {
  const context = testContext();
  const components = {
    api: [publicEndpoint],
    mcp: { endpoints: [{ id: 'get-customer' }] },
  };
  expect(() => buildMcp({ components, context })).toThrow(
    'MCP endpoint should have required property "scope". Set "mcp:read" or "mcp:write".'
  );
});

test('buildMcp throws when scope is outside the closed vocabulary', () => {
  const context = testContext();
  const components = {
    api: [publicEndpoint],
    mcp: { endpoints: [{ id: 'get-customer', scope: 'crm:read' }] },
  };
  expect(() => buildMcp({ components, context })).toThrow(
    'MCP endpoint "scope" should be "mcp:read" or "mcp:write".'
  );
});

test('buildMcp throws when an endpoint entry has an unknown property', () => {
  const context = testContext();
  const components = {
    api: [publicEndpoint],
    mcp: { endpoints: [{ id: 'get-customer', scope: 'mcp:read', name: 'customer' }] },
  };
  expect(() => buildMcp({ components, context })).toThrow(
    'MCP endpoint contains an unknown property. The known properties are "id" and "scope".'
  );
});

test('buildMcp throws when an endpoint reference does not exist', () => {
  const context = testContext();
  const components = { mcp: { endpoints: [{ id: 'missing', scope: 'mcp:read' }] } };
  expect(() => buildMcp({ components, context })).toThrow(
    'MCP endpoint "missing" does not reference a defined api endpoint.'
  );
});

test('buildMcp throws when an endpoint is an InternalApi endpoint', () => {
  const context = testContext();
  const components = {
    api: [{ ...publicEndpoint, type: 'InternalApi' }],
    mcp: { endpoints: [{ id: 'get-customer', scope: 'mcp:read' }] },
  };
  expect(() => buildMcp({ components, context })).toThrow(
    'MCP endpoint "get-customer" is an InternalApi endpoint. Only "Api" endpoints can be exposed as MCP tools.'
  );
});

test('buildMcp throws when an endpoint has no description', () => {
  const context = testContext();
  const components = {
    api: [{ ...publicEndpoint, description: undefined }],
    mcp: { endpoints: [{ id: 'get-customer', scope: 'mcp:read' }] },
  };
  expect(() => buildMcp({ components, context })).toThrow(
    'Endpoint "get-customer" is exposed as an MCP tool but does not have a "description".'
  );
});

test('buildMcp throws when an endpoint has no payloadSchema', () => {
  const context = testContext();
  const components = {
    api: [{ ...publicEndpoint, payloadSchema: undefined }],
    mcp: { endpoints: [{ id: 'get-customer', scope: 'mcp:read' }] },
  };
  expect(() => buildMcp({ components, context })).toThrow(
    'Endpoint "get-customer" is exposed as an MCP tool but does not have a "payloadSchema".'
  );
});

test('buildMcp throws when mcp.agents is present', () => {
  const context = testContext();
  const components = { mcp: { agents: ['some-agent'] } };
  expect(() => buildMcp({ components, context })).toThrow(
    'MCP agent tools are not supported. Remove "mcp.agents" from your config.'
  );
});

test('buildMcp throws on duplicate endpoint tool ids', () => {
  const context = testContext();
  const components = {
    api: [publicEndpoint],
    mcp: {
      endpoints: [
        { id: 'get-customer', scope: 'mcp:read' },
        { id: 'get-customer', scope: 'mcp:write' },
      ],
    },
  };
  expect(() => buildMcp({ components, context })).toThrow('Duplicate MCP tool "get-customer".');
});
