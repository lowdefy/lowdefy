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

import parsePageRoute from './buildRoutes/parsePageRoute.js';
import testContext from '../test-utils/testContext.js';
import validateMcpViews from './validateMcpViews.js';

function setup({ endpoints = [], viewPages = [] }) {
  const context = testContext();
  context.errors = [];
  context.routes = [
    parsePageRoute({ page: { id: 'home' } }),
    parsePageRoute({ page: { id: 'task', path: '{space}/tasks/{ref}' } }),
  ];
  context.mcpViewConfig = { viewPages, viewEndpoints: [] };
  const components = { mcp: { endpoints } };
  validateMcpViews({ components, context });
  return context.errors;
}

test('validateMcpViews accepts a view that gives every path placeholder a value', () => {
  const errors = setup({
    endpoints: [
      {
        id: 'open_task',
        view: {
          pageId: 'task',
          pathParams: { space: { _response: 'space.key' }, ref: { _payload: 'key' } },
        },
      },
      { id: 'show_home', view: { pageId: 'home' } },
      { id: 'list_tasks' },
    ],
    viewPages: ['home'],
  });
  expect(errors).toEqual([]);
});

test('validateMcpViews refuses a view pageId that names no page', () => {
  const errors = setup({
    endpoints: [{ id: 'open_task', view: { pageId: 'tsak', '~k': 'view-key' } }],
  });
  expect(errors.map((error) => error.message)).toEqual([
    'MCP endpoint "open_task" view references page "tsak", which does not exist.',
  ]);
  expect(errors[0].configKey).toBe('view-key');
});

test('validateMcpViews refuses a viewPages entry that names no page', () => {
  const viewPages = ['home', 'concept'];
  Object.defineProperty(viewPages, '~k', { value: 'view-pages-key' });
  const errors = setup({ viewPages });
  expect(errors.map((error) => error.message)).toEqual([
    'MCP "viewPages" entry "concept" does not reference a page.',
  ]);
  expect(errors[0].configKey).toBe('view-pages-key');
});

test('validateMcpViews refuses pathParams that miss a placeholder of the page path', () => {
  const errors = setup({
    endpoints: [
      {
        id: 'open_task',
        view: { pageId: 'task', pathParams: { ref: { _payload: 'key' } }, '~k': 'view-key' },
      },
    ],
  });
  expect(errors.map((error) => error.message)).toEqual([
    'MCP endpoint "open_task" view shows page "task" without path params "space". The page\'s path is "{space}/tasks/{ref}".',
  ]);
  expect(errors[0].configKey).toBe('view-key');
});

test('validateMcpViews refuses a view of a page with placeholders that has no pathParams', () => {
  const errors = setup({ endpoints: [{ id: 'open_task', view: { pageId: 'task' } }] });
  expect(errors.map((error) => error.message)).toEqual([
    'MCP endpoint "open_task" view shows page "task" without path params "space", "ref". The page\'s path is "{space}/tasks/{ref}".',
  ]);
});

test('validateMcpViews does nothing when buildMcp stopped on an invalid mcp block', () => {
  const context = testContext();
  context.errors = [];
  validateMcpViews({ components: { mcp: { endpoints: 'invalid' } }, context });
  expect(context.errors).toEqual([]);
});
