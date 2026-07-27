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

import buildTestPage from '@lowdefy/build/buildTestPage';
import * as operatorsClient from '@lowdefy/operators-js/operators/client';

import evaluatePage from './evaluatePage.js';

// The real client operator map is what the server injects — mirror it here.
const operators = { ...operatorsClient };

const blockMetas = {
  Box: { category: 'container' },
  Paragraph: { category: 'display' },
  List: { category: 'list', valueType: 'array' },
  TextInput: { category: 'input', valueType: 'string' },
};

// Resolve a fixture response asynchronously so the drain does real work — the
// engine has already awaited the init chain, but a report must still handle a
// response that settles on a later tick.
function asyncResponses(responses) {
  const calls = [];
  const callRequest = ({ requestId, payload }) => {
    calls.push({ requestId, payload });
    return new Promise((resolve) => {
      setTimeout(() => resolve({ response: responses[requestId] ?? null }), 1);
    });
  };
  return { callRequest, calls };
}

// evaluatePage receives an already-built page config (the runtime build
// artifact); build it here the way the engine's own tests do.
function run({ pageConfig, ...overrides }) {
  return evaluatePage({
    pageConfig: buildTestPage({ pageConfig }),
    operators,
    blockMetas,
    callRequest: () => Promise.resolve({ response: null }),
    serverUrl: 'https://reports.example.com',
    ...overrides,
  });
}

describe('init + request feeds a block property', () => {
  test('SetState runs and a request response reaches propertiesEval.output', async () => {
    const { callRequest } = asyncResponses({ getData: 'server-value' });
    const { context, warnings } = await run({
      callRequest,
      pageConfig: {
        id: 'page1',
        type: 'Box',
        events: {
          onInit: [
            { id: 'set', type: 'SetState', params: { greeting: 'hi' } },
            { id: 'req', type: 'Request', params: 'getData' },
          ],
        },
        requests: [{ id: 'getData', type: 'Fetch' }],
        blocks: [
          { id: 'out', type: 'Paragraph', properties: { content: { _request: 'getData' } } },
        ],
      },
    });

    expect(context.state.greeting).toBe('hi');
    expect(context._internal.RootSlots.map.out.propertiesEval.output).toEqual({
      content: 'server-value',
    });
    expect(warnings).toEqual([]);
  });
});

describe('seeded state is visible to an init request payload', () => {
  test('a request payload reading _state sees the seeded snapshot', async () => {
    const { callRequest, calls } = asyncResponses({ echo: 'ok' });
    await run({
      callRequest,
      seed: { state: { filter: 'active' } },
      pageConfig: {
        id: 'page1',
        type: 'Box',
        events: { onInit: [{ id: 'req', type: 'Request', params: 'echo' }] },
        requests: [{ id: 'echo', type: 'Fetch', payload: { f: { _state: 'filter' } } }],
      },
    });

    const echoCall = calls.find((call) => call.requestId === 'echo');
    expect(echoCall.payload).toEqual({ f: 'active' });
  });

  test('the seed snapshot is not mutated by init', async () => {
    const seedState = { filter: 'active' };
    const { context } = await run({
      seed: { state: seedState },
      pageConfig: {
        id: 'page1',
        type: 'Box',
        events: { onInit: [{ id: 'set', type: 'SetState', params: { filter: 'changed' } }] },
      },
    });

    expect(context.state.filter).toBe('changed');
    expect(seedState.filter).toBe('active');
  });
});

describe('seeded input is visible to _input', () => {
  test('a request payload reading _input sees the seeded input', async () => {
    const { callRequest, calls } = asyncResponses({ echo: 'ok' });
    await run({
      callRequest,
      seed: { input: { accountId: 'acc_42' } },
      pageConfig: {
        id: 'page1',
        type: 'Box',
        events: { onInit: [{ id: 'req', type: 'Request', params: 'echo' }] },
        requests: [{ id: 'echo', type: 'Fetch', payload: { a: { _input: 'accountId' } } }],
      },
    });

    const echoCall = calls.find((call) => call.requestId === 'echo');
    expect(echoCall.payload).toEqual({ a: 'acc_42' });
  });
});

describe('list block over a request response', () => {
  test('the engine builds evaluated children per item (arrayIndices untouched)', async () => {
    const { callRequest } = asyncResponses({
      getItems: [{ label: 'a' }, { label: 'b' }, { label: 'c' }],
    });
    const { context } = await run({
      callRequest,
      pageConfig: {
        id: 'page1',
        type: 'Box',
        events: {
          onInit: [
            { id: 'req', type: 'Request', params: 'getItems' },
            { id: 'set', type: 'SetState', params: { items: { _request: 'getItems' } } },
          ],
        },
        requests: [{ id: 'getItems', type: 'Fetch' }],
        blocks: [
          {
            id: 'items',
            type: 'List',
            blocks: [
              {
                id: 'items.$.label',
                type: 'Paragraph',
                properties: { content: { _state: 'items.$.label' } },
              },
            ],
          },
        ],
      },
    });

    const { map } = context._internal.RootSlots;
    expect(context.state.items).toHaveLength(3);
    expect(map['items.0.label'].propertiesEval.output).toEqual({ content: 'a' });
    expect(map['items.1.label'].propertiesEval.output).toEqual({ content: 'b' });
    expect(map['items.2.label'].propertiesEval.output).toEqual({ content: 'c' });
  });
});

describe('visible resolves after the drain', () => {
  test('a { _state } visible driven by a request response evaluates true', async () => {
    const { callRequest } = asyncResponses({ flag: true });
    const { context } = await run({
      callRequest,
      pageConfig: {
        id: 'page1',
        type: 'Box',
        events: {
          onInit: [
            { id: 'req', type: 'Request', params: 'flag' },
            { id: 'set', type: 'SetState', params: { show: { _request: 'flag' } } },
          ],
        },
        requests: [{ id: 'flag', type: 'Fetch' }],
        blocks: [{ id: 'panel', type: 'Box', visible: { _state: 'show' } }],
      },
    });

    expect(context._internal.RootSlots.map.panel.visibleEval.output).toBe(true);
  });

  test('a { _state } visible driven by a false response evaluates false', async () => {
    const { callRequest } = asyncResponses({ flag: false });
    const { context } = await run({
      callRequest,
      pageConfig: {
        id: 'page1',
        type: 'Box',
        events: {
          onInit: [
            { id: 'req', type: 'Request', params: 'flag' },
            { id: 'set', type: 'SetState', params: { show: { _request: 'flag' } } },
          ],
        },
        requests: [{ id: 'flag', type: 'Fetch' }],
        blocks: [{ id: 'panel', type: 'Box', visible: { _state: 'show' } }],
      },
    });

    expect(context._internal.RootSlots.map.panel.visibleEval.output).toBe(false);
  });
});

describe('warnings', () => {
  test('a browser-only action in onInit is skipped and recorded', async () => {
    const { warnings, context } = await run({
      pageConfig: {
        id: 'page1',
        type: 'Box',
        events: {
          onInit: [
            { id: 'scroll', type: 'ScrollTo', params: { blockId: 'page1' } },
            { id: 'set', type: 'SetState', params: { reached: true } },
          ],
        },
      },
    });

    expect(context.state.reached).toBe(true);
    expect(warnings).toHaveLength(1);
    expect(warnings[0].actionType).toBe('ScrollTo');
  });
});
