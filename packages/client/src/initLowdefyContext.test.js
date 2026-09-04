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

import initLowdefyContext from './initLowdefyContext.js';

function baseArgs(overrides = {}) {
  const lowdefy = {};
  return {
    auth: { user: null },
    Components: { Link: () => null },
    config: {
      pageConfig: { pageId: 'home' },
      rootConfig: {
        home: { configured: false, pageId: 'home' },
        menus: [],
        ...overrides,
      },
    },
    lowdefy,
    router: { basePath: '' },
    stage: 'production',
    types: { actions: {}, blocks: {}, icons: {}, operators: {} },
    window: { document: {}, fetch: () => undefined },
  };
}

test('initLowdefyContext sets lowdefyApp from rootConfig', () => {
  const args = baseArgs({ lowdefyApp: { slug: 'my-app', version: '1.2.3' } });
  const result = initLowdefyContext(args);
  expect(result.lowdefyApp).toEqual({ slug: 'my-app', version: '1.2.3' });
});

test('initLowdefyContext leaves lowdefyApp undefined when rootConfig has none', () => {
  const args = baseArgs();
  const result = initLowdefyContext(args);
  expect(result.lowdefyApp).toBeUndefined();
});

test('initLowdefyContext sets lowdefyGlobal from rootConfig', () => {
  const args = baseArgs({ lowdefyGlobal: { key: 'value' } });
  const result = initLowdefyContext(args);
  expect(result.lowdefyGlobal).toEqual({ key: 'value' });
});

test('initLowdefyContext exposes no perf helpers on a production build', () => {
  const result = initLowdefyContext(baseArgs());
  expect(result.startPerf).toBeUndefined();
  expect(result.readPerf).toBeUndefined();
  expect(result.perf).toBeUndefined();
});

test('startPerf turns engine counters on for the contexts a dev session already built', () => {
  const args = { ...baseArgs(), stage: 'dev' };
  const perf = { snapshot: () => ({ updates: 3 }) };
  const result = initLowdefyContext(args);
  const internal = {
    RootSlots: { map: { a: {}, b: {} } },
    enablePerf: () => {
      internal.perf = perf;
    },
  };
  result.contexts = { 'page:home': { _internal: internal } };

  expect(result.perf).toBeUndefined();
  result.startPerf();

  expect(result.perf).toBe(true);
  expect(result.readPerf()).toEqual([{ id: 'page:home', blocks: 2, updates: 3 }]);
});

test('readPerf skips contexts that are not counting', () => {
  const args = { ...baseArgs(), stage: 'dev' };
  const result = initLowdefyContext(args);
  result.contexts = { 'page:home': { _internal: { perf: undefined } } };
  expect(result.readPerf()).toEqual([]);
});
