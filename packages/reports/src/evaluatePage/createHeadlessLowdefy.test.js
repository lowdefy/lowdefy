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

import getContext from '@lowdefy/engine';
import buildTestPage from '@lowdefy/build/buildTestPage';
import { ConfigError } from '@lowdefy/errors';
import { WebParser } from '@lowdefy/operators';
import * as operatorsClient from '@lowdefy/operators-js/operators/client';

import createHeadlessLowdefy from './createHeadlessLowdefy.js';

// The real client operator map is what the server injects — mirror it here.
const operators = { ...operatorsClient };

function build(overrides = {}) {
  return createHeadlessLowdefy({
    pageConfig: { id: 'page1', pageId: 'page1', type: 'Box' },
    operators,
    blockMetas: { Box: { category: 'container' } },
    callRequest: () => Promise.resolve({ response: null }),
    serverUrl: 'https://reports.example.com',
    user: { name: 'Ada', roles: ['admin'] },
    ...overrides,
  });
}

// A minimal context is enough to exercise operator resolution through the real
// WebParser — the engine's per-context structures are covered by task 3.
function makeParser(lowdefy) {
  const context = {
    id: lowdefy.pageId,
    pageId: lowdefy.pageId,
    eventLog: [],
    jsMap: {},
    requests: {},
    state: {},
    _internal: { lowdefy },
  };
  return new WebParser({ context, operators: lowdefy._internal.operators });
}

function parse(lowdefy, input) {
  return makeParser(lowdefy).parse({ input, location: 'page1' });
}

// Drive a page through getContext + onInit with the real engine and actions.
async function initContext(handle) {
  const context = getContext({
    config: buildTestPage({ pageConfig: handle.pageConfig }),
    jsMap: handle.jsMap,
    lowdefy: handle.lowdefy,
    resetContext: { reset: true, setReset: () => {} },
  });
  await context._internal.runOnInit(() => {});
  await context._internal.runOnInitAsync(() => {});
  return context;
}

describe('synthetic window operators', () => {
  test('_media returns the fixed print viewport', () => {
    const { lowdefy } = build();
    expect(parse(lowdefy, { _media: 'width' }).output).toBe(1200);
    expect(parse(lowdefy, { _media: 'height' }).output).toBe(800);
    expect(parse(lowdefy, { _media: 'size' }).output).toBe('lg');
    expect(parse(lowdefy, { _media: 'darkMode' }).output).toBe(false);
  });

  test('_location resolves the synthetic URL', () => {
    const { lowdefy } = build();
    expect(parse(lowdefy, { _location: 'pathname' }).output).toBe('/page1');
    expect(parse(lowdefy, { _location: 'origin' }).output).toBe('https://reports.example.com');
    expect(parse(lowdefy, { _location: 'href' }).output).toBe('https://reports.example.com/page1');
  });

  test('urlQuery seed is encoded into the synthetic location', () => {
    const { lowdefy } = build({ seed: { urlQuery: { tab: 'sales' } } });
    expect(parse(lowdefy, { _location: 'search' }).output).toBe('?tab=sales');
    expect(parse(lowdefy, { _url_query: 'tab' }).output).toBe('sales');
  });
});

describe('_user invocation guard', () => {
  test('user render resolves user fields', () => {
    const { lowdefy } = build({ invocation: 'user', user: { name: 'Ada', roles: ['admin'] } });
    expect(parse(lowdefy, { _user: 'name' }).output).toBe('Ada');
    expect(parse(lowdefy, { '_user.hasRole': 'admin' }).output).toBe(true);
  });

  test('the parser swallows the guard, so the assertion is what fails a render', () => {
    // The operator's throw does not propagate: the parser collects every
    // operator error and substitutes null. Asserting only this — as this test
    // once did — passes while a scheduled report still renders and emails a
    // document with an empty name where the user should be.
    const { lowdefy, assertUserNotEvaluated } = build({ invocation: 'system' });
    const { output, errors } = parse(lowdefy, { _user: 'name' });
    expect(output).toBe(null);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toBeInstanceOf(ConfigError);
    expect(errors[0].message).toBe(
      "Page 'page1' uses _user and cannot be rendered on a schedule; pass explicit parameters via the schedule payload instead."
    );
    // The read was recorded, so the caller's assertion refuses the render.
    expect(() => assertUserNotEvaluated()).toThrow(ConfigError);
    expect(() => assertUserNotEvaluated()).toThrow(/cannot be rendered on a schedule/);
  });

  test('the assertion passes when _user was never evaluated', () => {
    const { lowdefy, assertUserNotEvaluated } = build({ invocation: 'system' });
    parse(lowdefy, { _media: 'width' });
    expect(() => assertUserNotEvaluated()).not.toThrow();
  });

  test('system render leaves other operators working (no spurious tripping)', () => {
    const { lowdefy } = build({ invocation: 'system' });
    expect(parse(lowdefy, { _media: 'width' }).output).toBe(1200);
    expect(parse(lowdefy, { _location: 'pathname' }).output).toBe('/page1');
  });

  test('the injected operator map is not mutated', () => {
    build({ invocation: 'system' });
    expect(operators._user).toBe(operatorsClient._user);
  });
});

describe('action registry', () => {
  test('SetState mutates state normally', async () => {
    const handle = build({
      pageConfig: {
        id: 'page1',
        pageId: 'page1',
        type: 'Box',
        events: { onInit: [{ id: 'set', type: 'SetState', params: { foo: 'bar' } }] },
      },
    });
    const context = await initContext(handle);
    expect(context.state.foo).toBe('bar');
    expect(handle.warnings).toEqual([]);
  });

  test('a skipped action (ScrollTo) resolves and records a warning', async () => {
    const handle = build({
      pageConfig: {
        id: 'page1',
        pageId: 'page1',
        type: 'Box',
        events: {
          onInit: [
            { id: 'scroll', type: 'ScrollTo', params: { blockId: 'page1' } },
            { id: 'set', type: 'SetState', params: { reached: true } },
          ],
        },
      },
    });
    const context = await initContext(handle);
    // The chain continued past the skipped action, proving it resolved.
    expect(context.state.reached).toBe(true);
    expect(handle.warnings).toHaveLength(1);
    expect(handle.warnings[0].actionType).toBe('ScrollTo');
    expect(handle.warnings[0].blockId).toBe('page1');
  });
});

describe('drainRequests', () => {
  test('resolves immediately when nothing is in flight', async () => {
    await expect(build().drainRequests()).resolves.toBeUndefined();
  });

  test('awaits a request that itself triggers a second request', async () => {
    const order = [];
    let calls = 0;
    let handle;
    const callRequest = (payload) => {
      calls += 1;
      return new Promise((resolve) => {
        if (payload.requestId === 'first') {
          setTimeout(() => {
            // Trigger a second request while the first is settling.
            handle.lowdefy._internal.callRequest({ requestId: 'second' });
            order.push('first');
            resolve({ response: 1 });
          }, 5);
        } else {
          setTimeout(() => {
            order.push('second');
            resolve({ response: 2 });
          }, 5);
        }
      });
    };
    handle = build({ callRequest });
    handle.lowdefy._internal.callRequest({ requestId: 'first' });
    await handle.drainRequests();
    expect(calls).toBe(2);
    expect(order).toEqual(['first', 'second']);
  });

  test('a rejected request does not stall the drain', async () => {
    const callRequest = () => Promise.reject(new Error('boom'));
    const handle = build({ callRequest });
    // Swallow the rejection on the caller side, as the engine's fetch would.
    handle.lowdefy._internal.callRequest({ requestId: 'x' }).catch(() => {});
    await expect(handle.drainRequests()).resolves.toBeUndefined();
  });
});

describe('lowdefy object shape', () => {
  test('is a fresh object per call and never memoizes into contexts', () => {
    const a = build();
    const b = build();
    expect(a.lowdefy).not.toBe(b.lowdefy);
    expect(a.lowdefy.contexts).toEqual({});
    expect(a.warnings).not.toBe(b.warnings);
  });

  test('exposes the injected inventory the engine expects', () => {
    const { lowdefy } = build({ blockMetas: { Box: { category: 'container' } } });
    expect(lowdefy._internal.blockMetas).toEqual({ Box: { category: 'container' } });
    expect(lowdefy._internal.globals.window.innerWidth).toBe(1200);
    expect(lowdefy._internal.globals.document).toBeUndefined();
    expect(typeof lowdefy._internal.displayMessage()).toBe('function');
    expect(lowdefy._internal.link()).toBeUndefined();
    expect(lowdefy._internal.initialised).toBe(true);
  });
});
