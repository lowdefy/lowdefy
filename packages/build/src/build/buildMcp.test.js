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

test('buildMcp returns components when no mcp config', () => {
  const context = testContext();
  const components = {};
  const res = buildMcp({ components, context });
  expect(res.mcp).toBe(undefined);
});

test('buildMcp returns components when mcp is null', () => {
  const context = testContext();
  const components = { mcp: null };
  const res = buildMcp({ components, context });
  expect(res.mcp).toBe(null);
});

test('buildMcp validates tool references exist as Api endpoints without error', () => {
  const context = testContext();
  const components = {
    api: [
      {
        id: 'endpoint:getWeather',
        endpointId: 'getWeather',
        type: 'Api',
        description: 'Get weather for a location',
        payloadSchema: { type: 'object', properties: { location: { type: 'string' } } },
        routine: [],
      },
      {
        id: 'endpoint:searchDocs',
        endpointId: 'searchDocs',
        type: 'Api',
        description: 'Search documentation',
        payloadSchema: { type: 'object', properties: { query: { type: 'string' } } },
        routine: [],
      },
    ],
    mcp: {
      name: 'my-mcp-server',
      version: '1.0.0',
      description: 'My MCP server',
      tools: ['getWeather', 'searchDocs'],
    },
  };
  const res = buildMcp({ components, context });
  expect(res.mcp).toEqual(components.mcp);
});

test('buildMcp throws ConfigError when tool references non-existent endpoint', () => {
  const context = testContext();
  const components = {
    api: [
      {
        id: 'endpoint:getWeather',
        endpointId: 'getWeather',
        type: 'Api',
        description: 'Get weather',
        payloadSchema: { type: 'object' },
        routine: [],
      },
    ],
    mcp: {
      tools: ['nonExistent'],
    },
  };
  expect(() => buildMcp({ components, context })).toThrow(
    'MCP tool "nonExistent" references non-existent endpoint.'
  );
});

test('buildMcp throws ConfigError when tool references InternalApi endpoint', () => {
  const context = testContext();
  const components = {
    api: [
      {
        id: 'endpoint:internalTool',
        endpointId: 'internalTool',
        type: 'InternalApi',
        description: 'Internal endpoint',
        payloadSchema: { type: 'object' },
        routine: [],
      },
    ],
    mcp: {
      tools: ['internalTool'],
    },
  };
  expect(() => buildMcp({ components, context })).toThrow(
    'MCP tool "internalTool" references InternalApi endpoint. Only Api endpoints can be exposed via MCP.'
  );
});

test('buildMcp warns when endpoint has no description', () => {
  const context = testContext();
  const warnings = [];
  context.handleWarning = (warning) => {
    warnings.push(warning);
  };
  const components = {
    api: [
      {
        id: 'endpoint:tool1',
        endpointId: 'tool1',
        type: 'Api',
        payloadSchema: { type: 'object' },
        routine: [],
      },
    ],
    mcp: {
      tools: ['tool1'],
    },
  };
  buildMcp({ components, context });
  expect(warnings).toHaveLength(1);
  expect(warnings[0].message).toBe(
    'Endpoint "tool1" listed in mcp.tools has no description. LLMs use the description for tool selection.'
  );
});

test('buildMcp warns when endpoint has no payloadSchema', () => {
  const context = testContext();
  const warnings = [];
  context.handleWarning = (warning) => {
    warnings.push(warning);
  };
  const components = {
    api: [
      {
        id: 'endpoint:tool1',
        endpointId: 'tool1',
        type: 'Api',
        description: 'A tool',
        routine: [],
      },
    ],
    mcp: {
      tools: ['tool1'],
    },
  };
  buildMcp({ components, context });
  expect(warnings).toHaveLength(1);
  expect(warnings[0].message).toBe(
    'Endpoint "tool1" listed in mcp.tools has no payloadSchema. LLMs need the schema to generate tool inputs.'
  );
});

test('buildMcp warns for both missing description and payloadSchema', () => {
  const context = testContext();
  const warnings = [];
  context.handleWarning = (warning) => {
    warnings.push(warning);
  };
  const components = {
    api: [
      {
        id: 'endpoint:tool1',
        endpointId: 'tool1',
        type: 'Api',
        routine: [],
      },
    ],
    mcp: {
      tools: ['tool1'],
    },
  };
  buildMcp({ components, context });
  expect(warnings).toHaveLength(2);
  expect(warnings[0].message).toContain('no description');
  expect(warnings[1].message).toContain('no payloadSchema');
});

test('buildMcp handles mcp with no tools', () => {
  const context = testContext();
  const components = {
    mcp: {
      name: 'my-server',
      version: '1.0.0',
    },
  };
  const res = buildMcp({ components, context });
  expect(res.mcp).toEqual({ name: 'my-server', version: '1.0.0' });
});

test('buildMcp handles mcp with empty tools array', () => {
  const context = testContext();
  const components = {
    mcp: {
      name: 'my-server',
      tools: [],
    },
  };
  const res = buildMcp({ components, context });
  expect(res.mcp).toEqual({ name: 'my-server', tools: [] });
});
