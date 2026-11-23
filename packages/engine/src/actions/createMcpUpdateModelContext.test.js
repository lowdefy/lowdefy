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

import { expect, test, vi } from 'vitest';

import testContext from '../../test/testContext.js';

const actions = {
  McpUpdateModelContext: ({ methods: { mcpUpdateModelContext }, params }) =>
    mcpUpdateModelContext(params),
};

// buildTestPage rewrites the config it is given, so each test builds its own.
const getPageConfig = () => ({
  id: 'root',
  type: 'Box',
  blocks: [
    {
      id: 'button',
      type: 'Button',
      events: {
        onClick: {
          try: [
            {
              id: 'send',
              type: 'McpUpdateModelContext',
              params: { text: 'The person renamed step 2.' },
            },
          ],
          catch: [{ id: 'caught', type: 'SetState', params: { caught: true } }],
        },
      },
    },
  ],
});

test('mcpUpdateModelContext sends the model context to the MCP host', async () => {
  const updateModelContext = vi.fn(async () => undefined);
  const context = await testContext({
    lowdefy: {
      _internal: { actions, mcp: { getDisplayMode: () => 'inline', updateModelContext } },
    },
    pageConfig: getPageConfig(),
  });
  const res = await context._internal.RootSlots.map.button.triggerEvent({ name: 'onClick' });
  expect(updateModelContext.mock.calls).toEqual([[{ text: 'The person renamed step 2.' }]]);
  expect(res.success).toBe(true);
  expect(context.state).toEqual({});
});

test('mcpUpdateModelContext fails the action and runs catch when the host refuses the model context', async () => {
  const updateModelContext = vi.fn(async () => {
    throw new Error('The MCP host refused the model context.');
  });
  const context = await testContext({
    lowdefy: {
      _internal: { actions, mcp: { getDisplayMode: () => 'inline', updateModelContext } },
    },
    pageConfig: getPageConfig(),
  });
  const res = await context._internal.RootSlots.map.button.triggerEvent({ name: 'onClick' });
  expect(res.success).toBe(false);
  expect(res.error.error.message).toContain('The MCP host refused the model context.');
  expect(context.state).toEqual({ caught: true });
});

test('mcpUpdateModelContext throws a plain error when the page is not inside an MCP host', async () => {
  const context = await testContext({
    lowdefy: { _internal: { actions } },
    pageConfig: getPageConfig(),
  });
  const res = await context._internal.RootSlots.map.button.triggerEvent({ name: 'onClick' });
  expect(res.success).toBe(false);
  expect(res.error.error.message).toContain(
    'McpUpdateModelContext needs an MCP host, and this page is not shown inside one. Run the action only when "_mcp: embedded" is true.'
  );
  expect(context.state).toEqual({ caught: true });
});
