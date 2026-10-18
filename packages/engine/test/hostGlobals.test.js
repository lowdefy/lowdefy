/**
 * @jest-environment node
 */
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

// The engine on a host with no browser: the host globals are plain objects, as a native shell
// passes them, and there is no window or document anywhere.

import { jest } from '@jest/globals';

import getTrace from '../src/trace/getTrace.js';
import resolveTarget from '../src/resolveTarget.js';
import testContext from './testContext.js';

function createGlobals() {
  return {
    fetch: jest.fn(),
    window: {
      location: {
        href: 'https://app.lowdefy.test/orders?status=open',
        origin: 'https://app.lowdefy.test',
        pathname: '/orders',
        search: '?status=open',
        hash: '',
      },
      innerWidth: 390,
      innerHeight: 844,
    },
  };
}

function createPageConfig() {
  return {
    id: 'orders',
    type: 'Box',
    requests: [
      {
        id: 'get_orders',
        type: 'Fetch',
        payload: { width: { _media: 'width' } },
      },
    ],
    blocks: [
      {
        id: 'load',
        type: 'Button',
        properties: { title: 'Load orders' },
        events: {
          onClick: [
            { id: 'clicked', type: 'SetState', params: { clicked: true } },
            { id: 'fetch', type: 'Request', params: 'get_orders' },
            { id: 'size', type: 'SetState', params: { size: { _media: 'size' } } },
          ],
        },
      },
    ],
  };
}

async function setup() {
  const globals = createGlobals();
  const callRequest = jest.fn(async ({ requestId }) => ({
    id: requestId,
    success: true,
    response: [{ name: 'Order 1' }],
  }));
  const context = await testContext({
    lowdefy: {
      basePath: '',
      linkPaths: {},
      pagePaths: { orders: '/orders' },
      _internal: { globals, callRequest },
    },
    pageConfig: createPageConfig(),
  });
  return { callRequest, context, globals, lowdefy: context._internal.lowdefy };
}

test('the test runs with no window or document', () => {
  expect(typeof window).toBe('undefined');
  expect(typeof document).toBe('undefined');
});

test('a page context, an action chain and a request run on plain host globals', async () => {
  const { callRequest, context } = await setup();
  const { load } = context._internal.RootSlots.map;
  const result = await load.triggerEvent({ name: 'onClick' });
  expect(result.success).toBe(true);
  // No host DOM event, so no block's event is skipped as a copy of another's.
  expect(result.handledBy).toBeUndefined();
  expect(callRequest).toHaveBeenCalledTimes(1);
  expect(callRequest.mock.calls[0][0]).toEqual({
    actionId: 'fetch',
    blockId: 'load',
    pageId: 'orders',
    requestId: 'get_orders',
    payload: { width: 390 },
  });
  expect(context.requests.get_orders[0].response).toEqual([{ name: 'Order 1' }]);
  expect(context.state).toEqual({ clicked: true, size: 'xs' });
});

test('a trace record is emitted and described from the host location', async () => {
  const { context, lowdefy } = await setup();
  const trace = getTrace(lowdefy);
  const payloads = [];
  trace.subscribe((payload) => payloads.push(payload));
  await context._internal.RootSlots.map.load.triggerEvent({ name: 'onClick' });
  expect(payloads).toHaveLength(1);
  expect(payloads[0]).toMatchObject({
    scope: 'page',
    pageId: 'orders',
    blockId: 'load',
    blockType: 'Button',
    eventName: 'onClick',
    success: true,
  });
  expect(trace.pageIdOf(lowdefy._internal.globals.window.location.href)).toBe('orders');
  expect(trace.isConfigText({ text: 'Load orders', pageId: 'orders' })).toBe(true);
  expect(trace.isConfigText({ text: 'Order 1', pageId: 'orders' })).toBe(false);
  const chain = 'button:nth-child="1"nth-of-type="1"text="Load orders";div:attr__id="bl-load"';
  expect(trace.describeChain(chain)).toMatchObject({
    page_id: 'orders',
    block_id: 'load',
    block_type: 'Button',
    text: 'Load orders',
  });
});

test('a link resolves against the host location', async () => {
  const { lowdefy } = await setup();
  expect(resolveTarget({ lowdefy, target: { url: 'example.com/help' } })).toMatchObject({
    kind: 'external',
    href: 'https://example.com/help',
  });
  expect(resolveTarget({ lowdefy, target: { url: 'https://app.lowdefy.test/orders' } })).toEqual(
    expect.objectContaining({ kind: 'page' })
  );
});
