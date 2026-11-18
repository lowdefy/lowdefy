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

import buildMcpViews from './buildMcpViews.js';
import testContext from '../test-utils/testContext.js';

function setup({
  endpoints,
  viewPages = [],
  viewEndpoints = [],
  pages,
  callApi = [],
  websocket = [],
}) {
  const context = testContext();
  context.errors = [];
  context.mcpViewConfig = { viewPages, viewEndpoints };
  context.mcpViews = { configured: true, pages: {}, sources: [] };
  context.websocketIds = new Set(['task-feed', 'presence']);
  context.callApiActionRefs = callApi.map(([sourcePageId, endpointId]) => ({
    sourcePageId,
    endpointId,
  }));
  context.websocketActionRefs = websocket.map(([sourcePageId, websocketId]) => ({
    sourcePageId,
    websocketId,
  }));
  const components = {
    api: [
      { id: 'endpoint:open_task', endpointId: 'open_task', type: 'Api' },
      { id: 'endpoint:task-reads', endpointId: 'task-reads', type: 'Api' },
      { id: 'endpoint:save-task', endpointId: 'save-task', type: 'Api' },
      { id: 'endpoint:internal', endpointId: 'internal', type: 'InternalApi' },
    ],
    mcp: { endpoints },
    pages,
  };
  buildMcpViews({ components, context });
  return { components, views: context.mcpViews };
}

test('buildMcpViews lists what each view page uses and marks the page', () => {
  const { components, views } = setup({
    endpoints: [
      { id: 'open_task', scope: 'mcp:read', view: { pageId: 'task' } },
      { id: 'list_tasks', scope: 'mcp:read' },
    ],
    viewPages: ['concept'],
    viewEndpoints: [{ id: 'task-reads', scope: 'mcp:read' }],
    pages: [
      { id: 'page:home', pageId: 'home', subscriptions: [] },
      { id: 'page:task', pageId: 'task', subscriptions: [{ websocketId: 'task-feed' }] },
      { id: 'page:concept', pageId: 'concept', subscriptions: [] },
    ],
    callApi: [
      ['task', 'task-reads'],
      ['task', 'save-task'],
      ['task', 'open_task'],
      ['task', 'task-reads'],
      ['home', 'save-task'],
    ],
    websocket: [
      ['task', 'presence'],
      ['task', 'task-feed'],
      ['home', 'presence'],
    ],
  });
  expect(views.pages).toEqual({
    concept: { endpoints: [], websockets: [], agents: [] },
    task: {
      endpoints: [
        { id: 'open_task', scope: 'mcp:read' },
        { id: 'save-task', scope: 'mcp:write' },
        { id: 'task-reads', scope: 'mcp:read' },
      ],
      websockets: ['presence', 'task-feed'],
      agents: [],
    },
  });
  expect(components.pages.map((page) => page.view)).toEqual([undefined, true, true]);
});

test('buildMcpViews gives a tool its tool scope over its viewEndpoints scope', () => {
  const { views } = setup({
    endpoints: [{ id: 'open_task', scope: 'mcp:write', view: { pageId: 'task' } }],
    viewEndpoints: [{ id: 'open_task', scope: 'mcp:read' }],
    pages: [{ id: 'page:task', pageId: 'task', subscriptions: [] }],
    callApi: [['task', 'open_task']],
  });
  expect(views.pages.task.endpoints).toEqual([{ id: 'open_task', scope: 'mcp:write' }]);
});

test('buildMcpViews leaves out endpoints and websockets a page cannot call', () => {
  const { views } = setup({
    endpoints: [{ id: 'open_task', scope: 'mcp:read', view: { pageId: 'task' } }],
    pages: [{ id: 'page:task', pageId: 'task', subscriptions: [] }],
    callApi: [
      ['task', 'internal'],
      ['task', 'missing'],
    ],
    websocket: [['task', 'missing']],
  });
  expect(views.pages.task).toEqual({ endpoints: [], websockets: [], agents: [] });
});

test('buildMcpViews writes one entry for a page that two tools and viewPages name', () => {
  const { views } = setup({
    endpoints: [
      { id: 'open_task', scope: 'mcp:read', view: { pageId: 'task' } },
      { id: 'save-task', scope: 'mcp:write', view: { pageId: 'task' } },
    ],
    viewPages: ['task'],
    pages: [{ id: 'page:task', pageId: 'task', subscriptions: [] }],
  });
  expect(Object.keys(views.pages)).toEqual(['task']);
});

test('buildMcpViews writes no pages and marks none when the app has no view', () => {
  const { components, views } = setup({
    endpoints: [{ id: 'list_tasks', scope: 'mcp:read' }],
    pages: [{ id: 'page:home', pageId: 'home', subscriptions: [] }],
    callApi: [['home', 'save-task']],
  });
  expect(views.pages).toEqual({});
  expect(components.pages[0].view).toBeUndefined();
});

test('buildMcpViews skips a view page that does not exist', () => {
  const { views } = setup({
    endpoints: [{ id: 'open_task', scope: 'mcp:read', view: { pageId: 'missing' } }],
    pages: [{ id: 'page:home', pageId: 'home', subscriptions: [] }],
  });
  expect(views.pages).toEqual({});
});
