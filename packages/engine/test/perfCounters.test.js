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

import testContext from './testContext.js';

const pageId = 'one';

const pageConfig = {
  id: 'root',
  type: 'Box',
  blocks: [
    {
      id: 'text_input',
      type: 'TextInput',
      required: true,
      visible: { _state: 'show' },
      properties: { title: { _state: 'title' } },
    },
    {
      id: 'button',
      type: 'Button',
      properties: { title: 'Save' },
    },
  ],
};

test('a context built without lowdefy.perf has no counters', async () => {
  const context = await testContext({ lowdefy: { pageId }, pageConfig });
  expect(context._internal.perf).toBeUndefined();
  context._internal.update();
  expect(context._internal.perf).toBeUndefined();
});

test('lowdefy.perf counts one parse per block expression on every update', async () => {
  const context = await testContext({ lowdefy: { pageId, perf: true }, pageConfig });
  const { perf } = context._internal;
  perf.reset();
  context._internal.update();
  const snapshot = perf.snapshot();

  // root + 2 blocks, each visited once by recEval, each parsing its nine
  // expressions; only the required block also parses a validation test.
  expect(snapshot.updates).toEqual(1);
  expect(snapshot.blockVisits).toEqual(3);
  expect(snapshot.parses.byKind).toEqual({
    visible: 3,
    properties: 3,
    required: 3,
    class: 3,
    style: 3,
    layout: 3,
    loading: 3,
    skeleton: 3,
    slotsLayout: 3,
    validate: 1,
  });
  expect(snapshot.parses.total).toEqual(28);
  expect(snapshot.updateMs.length).toEqual(1);
  // The per-block costs are keyed by the same ids RootSlots.map uses, which is
  // what lets a measurement report a block count alongside the heaviest blocks.
  expect(snapshot.blockCosts.map(({ blockId }) => blockId).sort()).toEqual(
    Object.keys(context._internal.RootSlots.map).sort()
  );
  expect(snapshot.blockCosts.length).toEqual(3);
  expect(snapshot.copyNodes).toBeGreaterThan(0);
});

test('a visibility flip re-runs the evaluation cascade inside one counted update', async () => {
  const context = await testContext({ lowdefy: { pageId, perf: true }, pageConfig });
  const { perf } = context._internal;
  perf.reset();
  context._internal.State.set('show', false);
  context._internal.update();
  const snapshot = perf.snapshot();

  expect(snapshot.updates).toEqual(1);
  expect(snapshot.blockVisits).toBeGreaterThan(3);
});

test('perf counters reset to zero on demand', async () => {
  const context = await testContext({ lowdefy: { pageId, perf: true }, pageConfig });
  context._internal.update();
  context._internal.perf.reset();
  const snapshot = context._internal.perf.snapshot();

  expect(snapshot).toEqual({
    updates: 0,
    blockVisits: 0,
    parses: { total: 0, byKind: {} },
    copyNodes: 0,
    updateMs: [],
    blockCosts: [],
  });
});

test('enablePerf starts counting on a context that was built without it', async () => {
  const context = await testContext({ lowdefy: { pageId }, pageConfig });
  expect(context._internal.perf).toBeUndefined();

  context._internal.enablePerf();
  context._internal.update();

  expect(context._internal.perf.snapshot().updates).toEqual(1);
});
