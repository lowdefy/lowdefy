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

const endpoint = {
  id: 'endpoint:get-customer',
  endpointId: 'get-customer',
  type: 'Api',
  description: 'Look up a customer.',
  payloadSchema: { type: 'object' },
};

test('buildMcp writes unconfigured defaults when no mcp block is defined', () => {
  const context = testContext();
  const components = {};
  const res = buildMcp({ components, context });
  expect(res.mcp).toEqual({
    name: 'lowdefy',
    version: '1.0.0',
    endpoints: [],
    configured: false,
  });
});

test('buildMcp keeps explicit name and version and sets configured', () => {
  const context = testContext();
  const components = {
    api: [endpoint],
    mcp: { name: 'my-tools', version: '2.0.0', endpoints: ['get-customer'] },
  };
  const res = buildMcp({ components, context });
  expect(res.mcp).toEqual({
    name: 'my-tools',
    version: '2.0.0',
    endpoints: ['get-customer'],
    configured: true,
  });
});

test('buildMcp keeps serverInfo branding (title, websiteUrl, icons)', () => {
  const context = testContext();
  const icons = [
    { src: 'https://example.com/icon-512.png', mimeType: 'image/png', sizes: ['512x512'] },
  ];
  const components = {
    api: [endpoint],
    mcp: {
      name: 'my-tools',
      title: 'My Tools',
      websiteUrl: 'https://example.com',
      icons,
      endpoints: ['get-customer'],
    },
  };
  const res = buildMcp({ components, context });
  expect(res.mcp).toMatchObject({
    name: 'my-tools',
    title: 'My Tools',
    websiteUrl: 'https://example.com',
    icons,
    configured: true,
  });
});

test('buildMcp throws when an endpoint reference does not exist', () => {
  const context = testContext();
  const components = { mcp: { endpoints: ['missing'] } };
  expect(() => buildMcp({ components, context })).toThrow(
    'MCP endpoint "missing" does not reference a defined api endpoint.'
  );
});

test('buildMcp throws when an endpoint is an InternalApi endpoint', () => {
  const context = testContext();
  const components = {
    api: [{ ...endpoint, type: 'InternalApi' }],
    mcp: { endpoints: ['get-customer'] },
  };
  expect(() => buildMcp({ components, context })).toThrow(
    'MCP endpoint "get-customer" is an InternalApi endpoint. Only "Api" endpoints can be exposed as MCP tools.'
  );
});

test('buildMcp throws when an endpoint has no description', () => {
  const context = testContext();
  const components = {
    api: [{ ...endpoint, description: undefined }],
    mcp: { endpoints: ['get-customer'] },
  };
  expect(() => buildMcp({ components, context })).toThrow(
    'Endpoint "get-customer" is exposed as an MCP tool but does not have a "description".'
  );
});

test('buildMcp throws when an endpoint has no payloadSchema', () => {
  const context = testContext();
  const components = {
    api: [{ ...endpoint, payloadSchema: undefined }],
    mcp: { endpoints: ['get-customer'] },
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
    api: [endpoint],
    mcp: { endpoints: ['get-customer', 'get-customer'] },
  };
  expect(() => buildMcp({ components, context })).toThrow('Duplicate MCP tool "get-customer".');
});
