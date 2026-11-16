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

import createStepRunner from './createStepRunner.js';

function pause(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// A page context shaped as the engine builds one, with no renderer: blocks keyed by id in its
// slots, each with its evaluated properties and visibility, its events and, for an input, setValue.
// An event's handler runs as its action chain, with the event loading while it runs.
function createPage() {
  const state = {};
  const map = {};

  function addBlock({
    blockId,
    handlers = {},
    input = false,
    meta,
    properties = {},
    visible = true,
  }) {
    const block = {
      blockId,
      meta,
      eval: { properties, visible },
      Events: { events: {} },
      triggerEvent: async ({ name }) => {
        const handler = handlers[name];
        if (handler === undefined) return;
        block.Events.events[name] = { loading: true };
        await handler();
        block.Events.events[name].loading = false;
      },
    };
    if (input) {
      block.setValue = (value) => {
        block.value = value;
        state[blockId] = value;
      };
    }
    map[blockId] = block;
    return block;
  }

  addBlock({
    blockId: 'title',
    input: true,
    handlers: {
      onChange: async () => {
        state.echo = state.title;
      },
      onPressEnter: async () => {
        state.entered = true;
      },
    },
  });
  addBlock({
    blockId: 'priority',
    input: true,
    properties: {
      options: [{ label: 'Low', value: 'low' }, { label: 'High', value: 'high' }, 'none'],
    },
  });
  addBlock({
    blockId: 'save',
    handlers: {
      onClick: async () => {
        await pause(100);
        state.saved = true;
      },
    },
  });
  addBlock({
    blockId: 'regions',
    input: true,
    meta: { valueType: 'array' },
    properties: { options: ['North', 'South'] },
  });
  addBlock({
    blockId: 'search',
    input: true,
    handlers: {
      // A trailing-edge debounce longer than any step: the event never finishes in the test.
      onChange: () => new Promise(() => {}),
    },
  });
  addBlock({ blockId: 'locked', properties: { disabled: true } });
  addBlock({ blockId: 'hidden', visible: false });

  const context = {
    requests: {},
    state,
    websockets: {},
    _internal: { onInitAsyncDone: true, onInitDone: true, RootSlots: { map } },
  };
  return { context, map, state };
}

function createRunner({ capture, hostName = 'headless run' } = {}) {
  const page = createPage();
  const lowdefy = { contexts: { 'page:form': page.context } };
  let shown = true;
  const runner = createStepRunner({
    capture,
    getLowdefy: () => lowdefy,
    getPageContext: () =>
      shown ? { context: page.context, page: { pageId: 'form' } } : { error: 'No page is open.' },
    hostName,
    timeout: 300,
  });
  async function fail(step) {
    const error = await runner.run({ step }).catch((caught) => caught);
    return error.message;
  }
  return {
    ...page,
    fail,
    hide: () => {
      shown = false;
    },
    run: (step) => runner.run({ step }),
  };
}

test('createStepRunner needs getLowdefy, getPageContext and a hostName', () => {
  const getLowdefy = () => ({});
  const getPageContext = () => ({ error: 'none' });
  expect(() => createStepRunner({ getPageContext, hostName: 'phone' })).toThrow(
    'createStepRunner needs a getLowdefy function.'
  );
  expect(() => createStepRunner({ getLowdefy, hostName: 'phone' })).toThrow(
    'createStepRunner needs a getPageContext function.'
  );
  expect(() => createStepRunner({ getLowdefy, getPageContext })).toThrow(
    'createStepRunner needs a hostName string. Received undefined.'
  );
});

test('a click step runs the block onClick and waits for its action chain to finish', async () => {
  const { run, state } = createRunner();
  expect(await run({ click: 'save' })).toEqual({ ok: true, settled: true });
  expect(state.saved).toBe(true);
});

test('a click step takes a { blockId } target', async () => {
  const { run, state } = createRunner();
  await run({ click: { blockId: 'save' } });
  expect(state.saved).toBe(true);
});

test('a fill step sets the input value, then runs its onChange', async () => {
  const { run, state } = createRunner();
  await run({ fill: { blockId: 'title', value: 'Quarterly' } });
  expect(state.title).toBe('Quarterly');
  expect(state.echo).toBe('Quarterly');
});

test('a press Enter step runs the onPressEnter of the input filled last', async () => {
  const { run, state } = createRunner();
  await run({ fill: { blockId: 'title', value: 'Quarterly' } });
  await run({ press: 'Enter' });
  expect(state.entered).toBe(true);
});

test('a select step matches the option label, or the value of an option without one', async () => {
  const { run, state } = createRunner();
  await run({ select: { blockId: 'priority', value: 'High' } });
  expect(state.priority).toBe('high');
  await run({ select: { blockId: 'priority', value: 'none' } });
  expect(state.priority).toBe('none');
});

test('a select step on a block whose value is a list ticks the option and keeps the rest', async () => {
  const { run, state } = createRunner();
  await run({ select: { blockId: 'regions', value: 'North' } });
  await run({ select: { blockId: 'regions', value: 'South' } });
  await run({ select: { blockId: 'regions', value: 'North' } });
  expect(state.regions).toEqual(['North', 'South']);
});

test('an event that does not finish within the settle does not hold the step', async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  try {
    const { run, state } = createRunner();
    const fill = run({ fill: { blockId: 'search', value: 'x' } });
    await vi.advanceTimersByTimeAsync(6000);
    expect(await fill).toEqual({ ok: true, settled: false });
    expect(state.search).toBe('x');
  } finally {
    vi.useRealTimers();
  }
});

test('a wait step takes ms, a request that finishes or state that is set', async () => {
  const { context, run } = createRunner();
  expect(await run({ wait: { ms: 10 } })).toEqual({ ok: true });
  context.requests.load = [{ loading: true }];
  setTimeout(() => {
    context.requests.load[0].loading = false;
  }, 60);
  expect(await run({ wait: { request: 'load' } })).toEqual({ ok: true });
  setTimeout(() => {
    context.state.ready = true;
  }, 60);
  expect(await run({ wait: { state: 'ready' } })).toEqual({ ok: true });
});

test('a step reports settled false when the page is still busy, without failing', async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  try {
    const { context, run } = createRunner();
    context.requests.slow = [{ loading: true }];
    const fill = run({ fill: { blockId: 'title', value: 'x' } });
    await vi.advanceTimersByTimeAsync(6000);
    expect(await fill).toEqual({ ok: true, settled: false });
  } finally {
    vi.useRealTimers();
  }
});

test('a screenshot step captures through the host, and a host without capture refuses it', async () => {
  const capture = vi.fn(async () => 'iVBORw0KGgo=');
  const phone = createRunner({ capture, hostName: 'phone' });
  expect(await phone.run({ screenshot: 'after-save' })).toEqual({
    ok: true,
    name: 'after-save',
    image: 'iVBORw0KGgo=',
  });
  expect(capture).toHaveBeenCalledTimes(1);
  const headless = createRunner();
  expect(await headless.fail({ screenshot: 'after-save' })).toBe(
    'A headless run takes no screenshots.'
  );
});

test('steps that cannot run say why, naming the host', async () => {
  const { fail, hide } = createRunner();
  expect(await fail({ click: 'missing' })).toBe(
    'Block "missing" is not on page "form". Waited 300 ms.'
  );
  expect(await fail({ click: 'hidden' })).toBe('Block "hidden" is not visible. Waited 300 ms.');
  expect(await fail({ click: 'locked' })).toBe('Block "locked" is disabled.');
  expect(await fail({ fill: { blockId: 'save', value: 'x' } })).toBe(
    'Block "save" is not an input.'
  );
  expect(await fail({ fill: { blockId: 'title' } })).toBe(
    'A fill step needs { blockId, value }. Received {"blockId":"title"}.'
  );
  expect(await fail({ select: { blockId: 'priority', value: 'Urgent' } })).toBe(
    'Block "priority" has no option "Urgent". Its options are ["Low","High","none"].'
  );
  expect(await fail({ press: 'Enter' })).toBe('Press "Enter" needs an input filled before it.');
  expect(await fail({ press: 'Tab' })).toBe('A headless run presses only "Enter". Received "Tab".');
  expect(await fail({ click: { blockId: 'save', text: 'Save' } })).toBe(
    'A step on a headless run targets a block by blockId only. Received {"blockId":"save","text":"Save"}.'
  );
  expect(await fail({ wait: { until: 'x' } })).toBe(
    'A wait step needs { ms }, { request } or { state }. Received {"until":"x"}.'
  );
  expect(await fail({ goto: 'home' })).toBe(
    'A headless run runs the steps click, fill, select, press, wait. Received "goto".'
  );
  expect(await fail({ click: 'save', fill: 'title' })).toMatch(/^A step is an object with one key/);
  hide();
  expect(await fail({ click: 'save' })).toBe('No page is open. Waited 300 ms.');
});
