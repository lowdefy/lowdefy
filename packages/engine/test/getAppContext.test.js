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
import buildTestPage from '@lowdefy/build/buildTestPage';
import { translate } from '@lowdefy/helpers';

import getAppContext from '../src/getAppContext.js';
import getContext from '../src/getContext.js';
import testOperators from './testOperators.js';

function getLowdefy({ actions = {}, lowdefyGlobal = {} } = {}) {
  return {
    apiResponses: {},
    appContext: null,
    contexts: {},
    home: {},
    inputs: {},
    pageInstances: {},
    lowdefyGlobal,
    menus: [],
    urlQuery: {},
    user: {},
    _internal: {
      actions: {
        SetGlobal: ({ methods: { setGlobal }, params }) => setGlobal(params),
        ...actions,
      },
      blockComponents: { Box: {}, Paragraph: {} },
      blockMetas: {
        Box: { category: 'container' },
        Paragraph: { category: 'display' },
      },
      displayMessage: () => () => {},
      handleError: jest.fn(),
      logger: { error: () => {}, warn: () => {}, log: () => {}, debug: () => {} },
      operators: testOperators,
      translate: (key, values) => translate({ key, values }),
    },
  };
}

function event(actions) {
  return { try: actions, catch: [] };
}

test('getAppContext memoizes the app context on lowdefy', () => {
  const lowdefy = getLowdefy();
  const first = getAppContext({ events: {}, lowdefy });
  const second = getAppContext({ events: {}, lowdefy });
  expect(first).toBe(second);
  expect(lowdefy.appContext).toBe(first);
});

test('getAppContext does not register the app context as a page context', () => {
  const lowdefy = getLowdefy();
  getAppContext({ events: {}, lowdefy });
  expect(lowdefy.contexts).toEqual({});
});

test('app onInit sets global before it resolves', async () => {
  const lowdefy = getLowdefy({ lowdefyGlobal: { ready: false } });
  const appContext = getAppContext({
    events: {
      onInit: event([{ id: 'set', type: 'SetGlobal', params: { ready: true } }]),
    },
    lowdefy,
  });
  await appContext._internal.runOnInit(() => {});
  expect(lowdefy.lowdefyGlobal).toEqual({ ready: true });
  expect(appContext._internal.onInitDone).toBe(true);
});

test('app onInit runs once when every page mount asks for it', async () => {
  const Count = jest.fn();
  const lowdefy = getLowdefy({ actions: { Count } });
  const appContext = getAppContext({
    events: { onInit: event([{ id: 'count', type: 'Count' }]) },
    lowdefy,
  });
  await Promise.all([
    appContext._internal.runOnInit(() => {}),
    appContext._internal.runOnInit(() => {}),
  ]);
  await appContext._internal.runOnInit(() => {});
  expect(Count).toHaveBeenCalledTimes(1);
});

test('app onInitAsync runs once, after app onInit', async () => {
  const calls = [];
  const lowdefy = getLowdefy({
    actions: {
      First: () => {
        calls.push('onInit');
      },
      Second: () => {
        calls.push('onInitAsync');
      },
    },
  });
  const appContext = getAppContext({
    events: {
      onInit: event([{ id: 'first', type: 'First' }]),
      onInitAsync: event([{ id: 'second', type: 'Second' }]),
    },
    lowdefy,
  });
  const asyncRun = appContext._internal.runOnInitAsync(() => {});
  await appContext._internal.runOnInitAsync(() => {});
  await asyncRun;
  expect(calls).toEqual(['onInit', 'onInitAsync']);
  expect(appContext._internal.onInitAsyncDone).toBe(true);
});

test('a global set by app onInitAsync re-evaluates the blocks of a mounted page', async () => {
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  const lowdefy = getLowdefy({
    actions: { Gate: () => gate },
    lowdefyGlobal: { theme: 'light' },
  });
  const appContext = getAppContext({
    events: {
      onInitAsync: event([
        { id: 'gate', type: 'Gate' },
        { id: 'set', type: 'SetGlobal', params: { theme: 'dark' } },
      ]),
    },
    lowdefy,
  });
  await appContext._internal.runOnInit(() => {});
  const asyncRun = appContext._internal.runOnInitAsync(() => {});

  const config = buildTestPage({
    pageConfig: {
      id: 'home',
      type: 'Box',
      blocks: [{ id: 'theme', type: 'Paragraph', properties: { content: { _global: 'theme' } } }],
    },
  });
  const pageContext = getContext({
    config,
    lowdefy,
    resetContext: { reset: true, setReset: () => {} },
  });
  await pageContext._internal.runOnInit(() => {});
  const block = pageContext._internal.RootSlots.map['theme'];
  expect(block.eval.properties.content).toEqual('light');

  release();
  await asyncRun;
  expect(block.eval.properties.content).toEqual('dark');
});

test('a failed app onInit action is reported and still resolves, so the page can load', async () => {
  const lowdefy = getLowdefy({
    actions: {
      Fail: () => {
        throw new Error('Settings unavailable.');
      },
    },
  });
  const appContext = getAppContext({
    events: {
      onInit: {
        try: [{ id: 'fail', type: 'Fail' }],
        catch: [{ id: 'fallback', type: 'SetGlobal', params: { settings: 'default' } }],
      },
    },
    lowdefy,
  });
  await appContext._internal.runOnInit(() => {});
  expect(lowdefy._internal.handleError).toHaveBeenCalledTimes(1);
  expect(lowdefy._internal.handleError.mock.calls[0][0].message).toContain('Settings unavailable.');
  expect(lowdefy.lowdefyGlobal).toEqual({ settings: 'default' });
  expect(appContext._internal.onInitDone).toBe(true);
  expect(appContext.eventLog[0]).toMatchObject({
    blockId: 'app',
    eventName: 'onInit',
    success: false,
  });
});
