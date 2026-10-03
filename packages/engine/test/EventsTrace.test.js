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
import { Validate } from '@lowdefy/actions-core/actions';
import { serializer, translate } from '@lowdefy/helpers';

import getAppContext from '../src/getAppContext.js';
import getTrace from '../src/trace/getTrace.js';
import testContext from './testContext.js';
import testOperators from './testOperators.js';

const pageId = 'one';

console.error = () => {};

function failingCallAPI() {
  throw new Error('Timed out.');
}

function createLowdefy() {
  return {
    pageId,
    _internal: { actions: { CallAPI: failingCallAPI, Validate } },
  };
}

function buttonPage(onClick, extraBlocks = []) {
  return {
    id: 'root',
    type: 'Box',
    blocks: [{ id: 'button', type: 'Button', events: { onClick } }, ...extraBlocks],
  };
}

function setState(id, params) {
  return { id, type: 'SetState', params };
}

async function setup({ onClick, extraBlocks, state = false }) {
  const context = await testContext({
    lowdefy: createLowdefy(),
    pageConfig: buttonPage(onClick, extraBlocks),
  });
  const payloads = [];
  getTrace(context._internal.lowdefy).subscribe((payload) => payloads.push(payload), { state });
  return { button: context._internal.RootSlots.map.button, context, payloads };
}

test('a completed event emits one payload after its eventLog entry', async () => {
  const { button, context, payloads } = await setup({
    onClick: [setState('set', { clicked: true })],
  });
  let eventLogAtEmit;
  getTrace(context._internal.lowdefy).subscribe(() => {
    eventLogAtEmit = [...context.eventLog];
  });
  const res = await button.triggerEvent({ name: 'onClick' });
  expect(payloads).toHaveLength(1);
  expect(eventLogAtEmit[0]).toBe(res);
  expect(payloads[0]).toEqual({
    scope: 'page',
    pageId: 'root',
    blockId: 'button',
    blockType: 'Button',
    eventName: 'onClick',
    success: true,
    failure: null,
    debounceMs: 0,
    actions: [setState('set', { clicked: true })],
    record: res,
    context,
    stateBefore: undefined,
  });
});

test('the payload actions are the declared try and catch actions', async () => {
  const { button, payloads } = await setup({
    onClick: { try: [setState('a', { a: 1 })], catch: [setState('b', { b: 1 })] },
  });
  await button.triggerEvent({ name: 'onClick' });
  expect(payloads[0].actions).toEqual([setState('a', { a: 1 }), setState('b', { b: 1 })]);
});

test('an event with no actions emits nothing', async () => {
  const { context, payloads } = await setup({
    onClick: [setState('set', { clicked: true })],
    extraBlocks: [{ id: 'text', type: 'Paragraph' }],
  });
  await context._internal.RootSlots.map.text.triggerEvent({ name: 'onClick' });
  expect(payloads).toEqual([]);
});

test('a bounced trailing debounced event emits nothing', async () => {
  const { button, payloads } = await setup({
    onClick: { debounce: { ms: 10 }, try: [setState('set', { clicked: true })] },
  });
  const first = button.triggerEvent({ name: 'onClick' });
  const second = button.triggerEvent({ name: 'onClick' });
  const [firstResult, secondResult] = await Promise.all([first, second]);
  expect(firstResult.bounced).toBe(true);
  expect(secondResult.bounced).toBe(false);
  expect(payloads).toHaveLength(1);
  expect(payloads[0].record).toBe(secondResult);
  expect(payloads[0].debounceMs).toBe(10);
});

test('a bounced leading-edge debounced event emits nothing', async () => {
  const { button, payloads } = await setup({
    onClick: {
      debounce: { immediate: true, ms: 50 },
      try: [setState('set', { clicked: true })],
    },
  });
  await button.triggerEvent({ name: 'onClick' });
  const bounced = await button.triggerEvent({ name: 'onClick' });
  expect(bounced.bounced).toBe(true);
  expect(payloads).toHaveLength(1);
});

test('debounceMs is the default 300 for a debounce without ms', async () => {
  const { button, payloads } = await setup({
    onClick: { debounce: { immediate: true }, try: [setState('set', { clicked: true })] },
  });
  await button.triggerEvent({ name: 'onClick' });
  expect(payloads[0].debounceMs).toBe(300);
});

test('a handledBy return emits nothing for the outer block', async () => {
  const context = await testContext({
    lowdefy: createLowdefy(),
    pageConfig: {
      id: 'root',
      type: 'Box',
      blocks: [
        {
          id: 'card',
          type: 'Box',
          events: { onClick: [setState('card', { card: true })] },
          blocks: [
            { id: 'button', type: 'Button', events: { onClick: [setState('b', { b: true })] } },
          ],
        },
      ],
    },
  });
  const payloads = [];
  getTrace(context._internal.lowdefy).subscribe((payload) => payloads.push(payload));
  const { button, card } = context._internal.RootSlots.map;
  const elements = ['button', 'card', 'root'].map((blockId) => ({ id: `bl-${blockId}` }));
  const domEvent = new Event('click');
  domEvent.composedPath = () => elements;
  global.window = { event: domEvent };
  global.document = { getElementById: (id) => elements.find((el) => el.id === id) ?? null };
  let results;
  try {
    results = await Promise.all([
      button.triggerEvent({ name: 'onClick' }),
      card.triggerEvent({ name: 'onClick' }),
    ]);
  } finally {
    delete global.window;
    delete global.document;
  }
  expect(results[1].handledBy).toBe('button');
  expect(payloads.map((payload) => payload.blockId)).toEqual(['button']);
});

test('stateBefore is the state before the chain ran, only for a state subscriber', async () => {
  const { button, context, payloads } = await setup({
    onClick: [setState('set', { count: 2 })],
    state: true,
  });
  const stateless = [];
  getTrace(context._internal.lowdefy).subscribe((payload) => stateless.push(payload));
  context._internal.State.set('count', 1);
  await button.triggerEvent({ name: 'onClick' });
  expect(payloads[0].stateBefore).toEqual({ count: 1 });
  expect(payloads[0].context.state).toEqual({ count: 2 });
  expect(stateless[0].stateBefore).toBeUndefined();
});

test('an event builds no trace payload while nobody subscribes', async () => {
  const context = await testContext({
    lowdefy: createLowdefy(),
    pageConfig: buttonPage([setState('set', { clicked: true })]),
  });
  const trace = getTrace(context._internal.lowdefy);
  const emit = jest.spyOn(trace, 'emit');
  const res = await context._internal.RootSlots.map.button.triggerEvent({ name: 'onClick' });
  expect(res.success).toBe(true);
  expect(context.eventLog[0]).toBe(res);
  expect(emit).not.toHaveBeenCalled();
});

function countStateCopies({ copy, context }) {
  return copy.mock.calls.filter(([value]) => value === context.state).length;
}

// Other engine code copies state too, so the test compares the copies of one event with and
// without a state subscriber.
test('state is copied for the trace only while a subscriber asks for state', async () => {
  const { button, context, payloads } = await setup({ onClick: [setState('set', { a: 1 })] });
  const copy = jest.spyOn(serializer, 'copy');
  try {
    await button.triggerEvent({ name: 'onClick' });
    const statelessCopies = countStateCopies({ copy, context });
    copy.mockClear();
    getTrace(context._internal.lowdefy).subscribe(() => {}, { state: true });
    await button.triggerEvent({ name: 'onClick' });
    expect(payloads).toHaveLength(2);
    expect(countStateCopies({ copy, context })).toBe(statelessCopies + 1);
  } finally {
    copy.mockRestore();
  }
});

test('a Validate failure carries the invalid block ids', async () => {
  const { button, payloads } = await setup({
    onClick: [{ id: 'check', type: 'Validate' }],
    extraBlocks: [
      { id: 'name', type: 'TextInput', required: true },
      { id: 'email', type: 'TextInput', required: true },
    ],
  });
  await button.triggerEvent({ name: 'onClick' });
  expect(payloads[0].success).toBe(false);
  expect(payloads[0].failure).toEqual({
    actionId: 'check',
    actionType: 'Validate',
    configKey: payloads[0].record.error.action['~k'] ?? null,
    errorName: 'UserError',
    invalidBlocks: ['name', 'email'],
  });
});

test('a throwing CallAPI failure carries action, error name and config key', async () => {
  const { button, payloads } = await setup({
    onClick: [{ id: 'load', type: 'CallAPI', params: { endpointId: 'x' } }],
  });
  await button.triggerEvent({ name: 'onClick' });
  const { failure, record } = payloads[0];
  expect(failure.actionId).toBe('load');
  expect(failure.actionType).toBe('CallAPI');
  expect(failure.errorName).toBe('ActionError');
  expect(failure.configKey).toBe(record.error.error.configKey);
  expect(failure.invalidBlocks).toEqual([]);
});

test('a parser error in an :if control carries a null action', async () => {
  const { button, payloads } = await setup({
    onClick: [{ ':if': { _divide: [1] }, ':then': [setState('a', { a: 1 })] }],
  });
  await button.triggerEvent({ name: 'onClick' });
  expect(payloads[0].success).toBe(false);
  expect(payloads[0].failure.actionId).toBeNull();
  expect(payloads[0].failure.actionType).toBeNull();
  expect(payloads[0].failure.errorName).toBe('OperatorError');
});

test('a throwing listener does not stop the next listener or the event', async () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    const { button, context } = await setup({ onClick: [setState('set', { a: 1 })] });
    const trace = getTrace(context._internal.lowdefy);
    const seen = [];
    trace.subscribe(() => {
      throw new Error('listener failed');
    });
    trace.subscribe((payload) => seen.push(payload.blockId));
    const first = await button.triggerEvent({ name: 'onClick' });
    await button.triggerEvent({ name: 'onClick' });
    expect(first.success).toBe(true);
    expect(context.state).toEqual({ a: 1 });
    expect(seen).toEqual(['button', 'button']);
    expect(warn).toHaveBeenCalledTimes(1);
  } finally {
    warn.mockRestore();
  }
});

test('action functions receive trace with subscribe and the describe functions, without emit', async () => {
  let received;
  const context = await testContext({
    lowdefy: {
      pageId,
      _internal: {
        actions: {
          Probe: ({ trace }) => {
            received = trace;
          },
        },
      },
    },
    pageConfig: buttonPage([{ id: 'probe', type: 'Probe' }]),
  });
  await context._internal.RootSlots.map.button.triggerEvent({ name: 'onClick' });
  expect(typeof received.subscribe).toBe('function');
  expect(typeof received.describeElement).toBe('function');
  expect(typeof received.describeChain).toBe('function');
  expect(typeof received.pageIdOf).toBe('function');
  expect(received.emit).toBeUndefined();
  expect(received.wantsState).toBeUndefined();
  expect(received).toBe(getTrace(context._internal.lowdefy).actionView);
});

test('an app onInit failure emits scope app with the page the app loaded on', async () => {
  const lowdefy = {
    apiResponses: {},
    appContext: null,
    contexts: {},
    home: {},
    inputs: {},
    lowdefyGlobal: {},
    menus: [],
    pageId: 'orders',
    urlQuery: {},
    user: {},
    _internal: {
      actions: { CallAPI: failingCallAPI },
      blockComponents: { Box: {} },
      blockMetas: { Box: { category: 'container' } },
      displayMessage: () => () => {},
      handleError: () => {},
      logger: { error: () => {}, warn: () => {}, log: () => {}, debug: () => {} },
      operators: testOperators,
      translate: (key, values) => translate({ key, values }),
    },
  };
  const payloads = [];
  getTrace(lowdefy).subscribe((payload) => payloads.push(payload));
  const appContext = getAppContext({
    events: {
      onInit: { try: [{ id: 'settings', type: 'CallAPI', params: {} }], catch: [] },
    },
    lowdefy,
  });
  await appContext._internal.runOnInit(() => {});
  expect(payloads).toHaveLength(1);
  expect(payloads[0]).toMatchObject({
    scope: 'app',
    pageId: 'orders',
    blockId: 'app',
    blockType: null,
    eventName: 'onInit',
    success: false,
  });
  expect(payloads[0].failure).toMatchObject({ actionId: 'settings', actionType: 'CallAPI' });
});
