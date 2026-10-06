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

import getContext from '../src/getContext.js';
import rememberPath from '../src/rememberPath.js';

const resetContext = { reset: false, setReset: () => {} };

function getLowdefy() {
  return {
    contexts: {},
    inputs: {},
    pageInstances: {},
    pathMemory: new Map(),
    _internal: {
      displayMessage: () => () => {},
      translate: (key) => key,
      operators: {},
      actions: {},
      blockComponents: { Box: {} },
      blockMetas: { Box: { category: 'container' } },
    },
  };
}

function ticketConfig() {
  const config = buildTestPage({ pageConfig: { id: 'ticket', type: 'Box' } });
  config.path = 'tickets/{space}/{ticket_id}';
  return config;
}

async function visit({ lowdefy, config, ticket_id }) {
  const context = getContext({
    config,
    lowdefy,
    pathParams: { space: 'support', ticket_id },
    resetContext,
  });
  await context._internal.runOnInit(() => {});
  return context;
}

test('a page with placeholders has one context and input per set of values', async () => {
  const lowdefy = getLowdefy();
  const config = ticketConfig();
  const one = await visit({ lowdefy, config, ticket_id: '1' });
  const two = await visit({ lowdefy, config, ticket_id: '2' });
  expect(one).not.toBe(two);
  expect(one.instanceKey).toEqual('page:ticket#tickets/support/1');
  expect(two.instanceKey).toEqual('page:ticket#tickets/support/2');
  expect(one.pathParams).toEqual({ space: 'support', ticket_id: '1' });
  expect(two.pathParams).toEqual({ space: 'support', ticket_id: '2' });
  one.state.title = 'First';
  lowdefy.inputs[one.instanceKey].from = 'list';
  expect(two.state).toEqual({});
  expect(lowdefy.inputs[two.instanceKey]).toEqual({});
  expect(lowdefy.contexts[one.instanceKey]).toBe(one);
  expect(lowdefy.contexts[two.instanceKey]).toBe(two);
});

test('returning to a page instance reuses its context without rerunning onInit', async () => {
  const lowdefy = getLowdefy();
  const config = ticketConfig();
  const one = await visit({ lowdefy, config, ticket_id: '1' });
  one.state.title = 'First';
  await visit({ lowdefy, config, ticket_id: '2' });
  const runOnInitDone = one._internal.onInitDone;
  const again = await visit({ lowdefy, config, ticket_id: '1' });
  expect(again).toBe(one);
  expect(runOnInitDone).toBe(true);
  expect(again.state).toEqual({ title: 'First' });
});

test('a query change on the same values reuses the page instance', async () => {
  const lowdefy = getLowdefy();
  lowdefy._internal.globals = { window: { location: { search: '?tab=1' } } };
  const config = ticketConfig();
  const one = await visit({ lowdefy, config, ticket_id: '1' });
  one.state.title = 'First';
  lowdefy._internal.globals.window.location.search = '?tab=2';
  const again = await visit({ lowdefy, config, ticket_id: '1' });
  expect(again).toBe(one);
  expect(again.state).toEqual({ title: 'First' });
  expect(lowdefy.pageInstances.ticket).toEqual(['page:ticket#tickets/support/1']);
});

test('a page keeps its 10 most recently rendered instances', async () => {
  const lowdefy = getLowdefy();
  const config = ticketConfig();
  const one = await visit({ lowdefy, config, ticket_id: '1' });
  lowdefy.inputs[one.instanceKey].from = 'list';
  for (let id = 2; id <= 10; id += 1) {
    await visit({ lowdefy, config, ticket_id: String(id) });
  }
  expect(await visit({ lowdefy, config, ticket_id: '1' })).toBe(one);
  for (let id = 11; id <= 20; id += 1) {
    await visit({ lowdefy, config, ticket_id: String(id) });
  }
  expect(Object.keys(lowdefy.contexts)).toHaveLength(10);
  expect(lowdefy.contexts[one.instanceKey]).toBeUndefined();
  expect(lowdefy.inputs[one.instanceKey]).toBeUndefined();
  const firstVisit = getContext({
    config,
    lowdefy,
    pathParams: { space: 'support', ticket_id: '1' },
    resetContext,
  });
  expect(firstVisit).not.toBe(one);
  expect(firstVisit._internal.onInitDone).toBeUndefined();
  expect(lowdefy.inputs[firstVisit.instanceKey]).toEqual({});
});

test('the instance limit counts each page on its own', async () => {
  const lowdefy = getLowdefy();
  const config = ticketConfig();
  const home = getContext({
    config: buildTestPage({ pageConfig: { id: 'home', type: 'Box' } }),
    lowdefy,
    resetContext,
  });
  for (let id = 1; id <= 12; id += 1) {
    await visit({ lowdefy, config, ticket_id: String(id) });
  }
  expect(lowdefy.contexts['page:home']).toBe(home);
  expect(lowdefy.pageInstances.ticket).toHaveLength(10);
});

test('a page without placeholders keeps one context under its page id', () => {
  const lowdefy = getLowdefy();
  const config = buildTestPage({ pageConfig: { id: 'about', type: 'Box' } });
  config.path = 'company/about';
  const context = getContext({ config, lowdefy, resetContext });
  expect(context.instanceKey).toEqual('page:about');
  expect(context.pathParams).toEqual({});
  expect(lowdefy.contexts['page:about']).toBe(context);
});

test('two spellings of the same values land on one context', () => {
  const lowdefy = getLowdefy();
  const config = ticketConfig();
  const encoded = rememberPath({
    lowdefy,
    path: 'tickets/a%2Bb/1',
    pageId: 'ticket',
    pathParams: { space: 'a+b', ticket_id: '1' },
    pattern: config.path,
  });
  const plain = rememberPath({
    lowdefy,
    path: 'tickets/a+b/1',
    pageId: 'ticket',
    pathParams: { space: 'a+b', ticket_id: '1' },
    pattern: config.path,
  });
  expect(encoded.instanceKey).toEqual(plain.instanceKey);
  const first = getContext({ config, lowdefy, pathParams: plain.pathParams, resetContext });
  const second = getContext({ config, lowdefy, pathParams: encoded.pathParams, resetContext });
  expect(first).toBe(second);
  expect(first.instanceKey).toEqual(plain.instanceKey);
});

test('a dynamic page rebuilds per fetch under its instance key', () => {
  const lowdefy = getLowdefy();
  const config1 = ticketConfig();
  config1.dynamic = true;
  const config2 = ticketConfig();
  config2.dynamic = true;
  const pathParams = { space: 'support', ticket_id: '1' };
  const c1 = getContext({ config: config1, lowdefy, pathParams, resetContext });
  expect(getContext({ config: config1, lowdefy, pathParams, resetContext })).toBe(c1);
  const c2 = getContext({ config: config2, lowdefy, pathParams, resetContext });
  expect(c2).not.toBe(c1);
  expect(c2.instanceKey).toEqual('page:ticket#tickets/support/1');
  expect(lowdefy.contexts[c2.instanceKey]).toBe(c2);
});

test('getContext throws when a page with placeholders gets no value for one', () => {
  const lowdefy = getLowdefy();
  expect(() =>
    getContext({
      config: ticketConfig(),
      lowdefy,
      pathParams: { space: 'support' },
      resetContext,
    })
  ).toThrow('Link to page "ticket" is missing a value for path placeholder "ticket_id".');
});
