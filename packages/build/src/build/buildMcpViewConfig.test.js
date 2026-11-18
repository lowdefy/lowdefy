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

import { expect, test } from 'vitest';

import buildMcp from './buildMcp.js';
import testContext from '../test-utils/testContext.js';

const oauthProviderAuth = { oauthProvider: { consentPage: '/oauth/consent' } };

function endpoint({ id, required }) {
  return {
    id: `endpoint:${id}`,
    endpointId: id,
    type: 'Api',
    description: 'An endpoint.',
    payloadSchema: { type: 'object', properties: { key: { type: 'string' } }, required },
    auth: { public: false },
  };
}

// addKeys sets ~k as a non-enumerable property.
function withKey(object, key) {
  Object.defineProperty(object, '~k', { value: key });
  return object;
}

function buildViews({ mcp, auth = oauthProviderAuth, api = [endpoint({ id: 'open_task' })] }) {
  const context = testContext();
  context.errors = [];
  const components = { api, auth, mcp };
  buildMcp({ components, context });
  return { components, context };
}

test('buildMcpViewConfig writes unconfigured views when no tool has a view', () => {
  const { context } = buildViews({
    mcp: { endpoints: [{ id: 'open_task', scope: 'mcp:read' }] },
  });
  expect(context.errors).toEqual([]);
  expect(context.mcpViews).toEqual({ configured: false, pages: {}, sources: [] });
  expect(context.mcpViewConfig).toEqual({ viewPages: [], viewEndpoints: [] });
});

test('buildMcpViewConfig defaults entrypoint to false and keeps view operators unevaluated', () => {
  const { components, context } = buildViews({
    mcp: {
      endpoints: [
        {
          id: 'open_task',
          scope: 'mcp:read',
          view: {
            pageId: 'task',
            pathParams: { space: { _response: 'space.key' }, ref: { _payload: 'key' } },
            urlQuery: { tab: { _payload: 'tab' } },
          },
        },
      ],
    },
  });
  expect(context.errors).toEqual([]);
  expect(components.mcp.endpoints[0].view).toEqual({
    pageId: 'task',
    pathParams: { space: { _response: 'space.key' }, ref: { _payload: 'key' } },
    urlQuery: { tab: { _payload: 'tab' } },
    entrypoint: false,
  });
  expect(context.mcpViews.configured).toBe(true);
});

test('buildMcpViewConfig counts _payload and _response in a view as server operators', () => {
  const { context } = buildViews({
    mcp: {
      endpoints: [
        {
          id: 'open_task',
          scope: 'mcp:read',
          view: {
            pageId: 'task',
            pathParams: { space: { _response: 'space.key' } },
            urlQuery: { ref: { _payload: 'key' } },
          },
        },
      ],
    },
  });
  expect(context.typeCounters.operators.server.getCounts()).toEqual({ _response: 1, _payload: 1 });
  expect(context.typeCounters.operators.client.getCounts()).toEqual({});
});

test('buildMcpViewConfig moves viewPages and viewEndpoints off the mcp block and keeps sources', () => {
  const { components, context } = buildViews({
    api: [endpoint({ id: 'open_task' }), endpoint({ id: 'task-reads' })],
    mcp: {
      endpoints: [{ id: 'open_task', scope: 'mcp:read', view: { pageId: 'task' } }],
      viewPages: ['concept'],
      viewSources: ['https://files.example.com', { _secret: 'ANALYTICS_HOST' }],
      viewEndpoints: [{ id: 'task-reads', scope: 'mcp:read' }],
    },
  });
  expect(context.errors).toEqual([]);
  expect(components.mcp.viewPages).toBeUndefined();
  expect(components.mcp.viewSources).toBeUndefined();
  expect(components.mcp.viewEndpoints).toBeUndefined();
  expect(components.mcp.views).toBeUndefined();
  expect(context.mcpViews).toEqual({
    configured: true,
    pages: {},
    sources: ['https://files.example.com', { _secret: 'ANALYTICS_HOST' }],
  });
  expect(context.mcpViewConfig).toEqual({
    viewPages: ['concept'],
    viewEndpoints: [{ id: 'task-reads', scope: 'mcp:read' }],
  });
  expect(context.typeCounters.operators.server.getCount('_secret')).toBe(1);
});

test('buildMcpViewConfig refuses a view when auth.oauthProvider is not configured', () => {
  const { context } = buildViews({
    auth: {},
    api: [{ ...endpoint({ id: 'open_task' }), auth: { public: true } }],
    mcp: {
      endpoints: [
        { id: 'open_task', scope: 'mcp:read', view: withKey({ pageId: 'task' }, 'view-key') },
      ],
    },
  });
  expect(context.errors.map((error) => error.message)).toEqual([
    'MCP views require "auth.oauthProvider". Configure the app\'s OAuth authorization server, or remove "view" from the MCP endpoints and "mcp.viewPages".',
  ]);
  expect(context.errors[0].configKey).toBe('view-key');
});

test('buildMcpViewConfig refuses viewPages when auth.oauthProvider is not configured', () => {
  const { context } = buildViews({ auth: {}, api: [], mcp: { viewPages: ['concept'] } });
  expect(context.errors).toHaveLength(1);
  expect(context.errors[0].message).toContain('MCP views require "auth.oauthProvider".');
});

test('buildMcpViewConfig refuses an entry point whose payloadSchema has required properties', () => {
  const { context } = buildViews({
    api: [endpoint({ id: 'open_task', required: ['key'] })],
    mcp: {
      endpoints: [
        {
          id: 'open_task',
          scope: 'mcp:read',
          view: withKey({ pageId: 'task', entrypoint: true }, 'view-key'),
        },
      ],
    },
  });
  expect(context.errors.map((error) => error.message)).toEqual([
    'MCP endpoint "open_task" view is an entry point, but its "payloadSchema" has required properties. An entry point is called with no arguments, so remove "entrypoint" or the required properties.',
  ]);
  expect(context.errors[0].configKey).toBe('view-key');
});

test('buildMcpViewConfig allows an entry point whose payloadSchema requires nothing', () => {
  const { context } = buildViews({
    api: [endpoint({ id: 'open_task', required: [] })],
    mcp: {
      endpoints: [
        { id: 'open_task', scope: 'mcp:read', view: { pageId: 'task', entrypoint: true } },
      ],
    },
  });
  expect(context.errors).toEqual([]);
});

test('buildMcpViewConfig allows required properties on a view that is not an entry point', () => {
  const { context } = buildViews({
    api: [endpoint({ id: 'open_task', required: ['key'] })],
    mcp: { endpoints: [{ id: 'open_task', scope: 'mcp:read', view: { pageId: 'task' } }] },
  });
  expect(context.errors).toEqual([]);
});

test('buildMcpViewConfig refuses a viewEndpoints id that names no endpoint', () => {
  const { context } = buildViews({
    mcp: {
      endpoints: [{ id: 'open_task', scope: 'mcp:read', view: { pageId: 'task' } }],
      viewEndpoints: [withKey({ id: 'missing', scope: 'mcp:read' }, 'view-endpoint-key')],
    },
  });
  expect(context.errors.map((error) => error.message)).toEqual([
    'MCP view endpoint "missing" does not reference a defined api endpoint.',
  ]);
  expect(context.errors[0].configKey).toBe('view-endpoint-key');
});

test('buildMcpViewConfig refuses a duplicate viewEndpoints id', () => {
  const { context } = buildViews({
    mcp: {
      endpoints: [{ id: 'open_task', scope: 'mcp:read', view: { pageId: 'task' } }],
      viewEndpoints: [
        { id: 'open_task', scope: 'mcp:read' },
        { id: 'open_task', scope: 'mcp:write' },
      ],
    },
  });
  expect(context.errors.map((error) => error.message)).toEqual([
    'Duplicate MCP view endpoint "open_task".',
  ]);
});

test('buildMcpViewConfig refuses a viewSources object that is not an operator', () => {
  const { context } = buildViews({
    mcp: {
      endpoints: [{ id: 'open_task', scope: 'mcp:read', view: { pageId: 'task' } }],
      viewSources: [{ url: 'https://files.example.com' }],
    },
  });
  expect(context.errors.map((error) => error.message)).toEqual([
    'MCP "viewSources" items should be origin strings, or a _build or _secret operator.',
  ]);
});

test('buildMcp refuses a view without a pageId', () => {
  const context = testContext();
  const components = {
    api: [endpoint({ id: 'open_task' })],
    auth: oauthProviderAuth,
    mcp: { endpoints: [{ id: 'open_task', scope: 'mcp:read', view: { pathParams: {} } }] },
  };
  expect(() => buildMcp({ components, context })).toThrow(
    'MCP endpoint view should have required property "pageId".'
  );
});

test('buildMcp refuses an unknown view property', () => {
  const context = testContext();
  const components = {
    api: [endpoint({ id: 'open_task' })],
    auth: oauthProviderAuth,
    mcp: { endpoints: [{ id: 'open_task', scope: 'mcp:read', view: { pageId: 'task', page: 1 } }] },
  };
  expect(() => buildMcp({ components, context })).toThrow(
    'MCP endpoint "view" contains an unknown property. The known properties are "pageId", "pathParams", "urlQuery" and "entrypoint".'
  );
});

test('buildMcp refuses a viewEndpoints scope outside the scope vocabulary', () => {
  const context = testContext();
  const components = {
    api: [endpoint({ id: 'open_task' })],
    auth: oauthProviderAuth,
    mcp: { viewEndpoints: [{ id: 'open_task', scope: 'read' }] },
  };
  expect(() => buildMcp({ components, context })).toThrow(
    'MCP view endpoint "scope" should be "mcp:read" or "mcp:write".'
  );
});

test.each([
  '*',
  "'unsafe-inline'",
  'https://*.example.com',
  'https://files.example.com/path',
  'http://files.example.com',
])(
  'buildMcpViewConfig refuses the literal viewSources item %s, which is not an origin',
  (source) => {
    const { context } = buildViews({
      mcp: {
        endpoints: [{ id: 'open_task', scope: 'mcp:read', view: { pageId: 'task' } }],
        viewSources: ['https://files.example.com', source],
      },
    });
    expect(context.errors.map((error) => error.message)).toEqual([
      `MCP "viewSources" item "${source}" is not an origin. An item is one https or wss origin with no path, such as "https://files.example.com".`,
    ]);
  }
);

test('buildMcpViewConfig accepts https and wss origins and leaves a _secret for the server to check', () => {
  const { context } = buildViews({
    mcp: {
      endpoints: [{ id: 'open_task', scope: 'mcp:read', view: { pageId: 'task' } }],
      viewSources: ['https://files.example.com', 'wss://live.example.com', { _secret: 'ORIGIN' }],
    },
  });
  expect(context.errors).toEqual([]);
});

test.each(['_secret', '_js', '_user', '_state', '_function'])(
  'buildMcpViewConfig refuses %s in the pathParams and urlQuery of a view',
  (operator) => {
    const { context } = buildViews({
      mcp: {
        endpoints: [
          {
            id: 'open_task',
            scope: 'mcp:read',
            view: {
              pageId: 'task',
              pathParams: {
                ref: { '_string.concat': [[{ [operator]: 'x' }, { _payload: 'key' }]] },
              },
              urlQuery: { tab: { [operator]: 'x' } },
            },
          },
        ],
      },
    });
    const message = `MCP endpoint "open_task" view uses the operator "${operator}". The "pathParams" and "urlQuery" of a view can use only _payload, _response, _and, _array, _boolean, _eq, _get, _if, _if_none, _ne, _not, _number, _object, _or, _regex, _string, _switch, _type, _uri.`;
    expect(context.errors.map((error) => error.message)).toEqual([message, message]);
  }
);

test('buildMcpViewConfig accepts value operators around _payload and _response in a view', () => {
  const { context } = buildViews({
    mcp: {
      endpoints: [
        {
          id: 'open_task',
          scope: 'mcp:read',
          view: {
            pageId: 'task',
            pathParams: {
              ref: { '_string.toUpperCase': { _payload: 'key' } },
              space: { _if_none: [{ _response: 'space.key' }, 'main'] },
            },
            urlQuery: {
              tab: {
                _if: {
                  test: { _eq: [{ _payload: 'tab' }, 'files'] },
                  then: 'files',
                  else: 'notes',
                },
              },
            },
          },
        },
      ],
    },
  });
  expect(context.errors).toEqual([]);
});

test('buildMcp refuses an MCP endpoint whose tool name is the reserved lowdefy_view_session', () => {
  const { context } = buildViews({
    api: [endpoint({ id: 'lowdefy_view_session' })],
    mcp: { endpoints: [{ id: 'lowdefy_view_session', scope: 'mcp:read' }] },
  });
  expect(context.errors.map((error) => error.message)).toEqual([
    'MCP endpoint "lowdefy_view_session" would be the tool "lowdefy_view_session", a name the MCP server keeps for itself. Give the endpoint another id.',
  ]);
});

test('buildMcp accepts an MCP endpoint id whose tool name only resembles the reserved one', () => {
  const { context } = buildViews({
    api: [endpoint({ id: 'lowdefy/view_session' })],
    mcp: { endpoints: [{ id: 'lowdefy/view_session', scope: 'mcp:read' }] },
  });
  expect(context.errors).toEqual([]);
});
