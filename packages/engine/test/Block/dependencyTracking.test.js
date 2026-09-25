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

import createSetState from '../../src/actions/createSetState.js';
import DependencyTracker from '../../src/tracking/DependencyTracker.js';
import { countEvaluations, snapshot, trackingContext } from '../trackingContext.js';

const pageId = 'one';

// These tests are about tracked passes, so they hold even when the suite runs with test:full.
let trackerEnabled;
beforeAll(() => {
  trackerEnabled = DependencyTracker.enabled;
  DependencyTracker.enabled = true;
});
afterAll(() => {
  DependencyTracker.enabled = trackerEnabled;
});

function setState(context, params) {
  createSetState({ arrayIndices: [], context })(params);
}

function evaluatedIds(counts) {
  return Object.keys(counts).sort();
}

const formPage = {
  id: 'root',
  type: 'Box',
  blocks: [
    { id: 'name', type: 'TextInput' },
    {
      id: 'greeting',
      type: 'Paragraph',
      properties: {
        content: { '_string.concat': ['Hello ', { _if_none: [{ _state: 'name' }, ''] }] },
      },
    },
    { id: 'other', type: 'TextInput' },
    { id: 'echo', type: 'Paragraph', properties: { content: { _state: 'other' } } },
    { id: 'static', type: 'Paragraph', properties: { content: 'static' } },
  ],
};

test('setValue evaluates only the input and the blocks that read its value', async () => {
  const context = await trackingContext({ lowdefy: { pageId }, pageConfig: formPage });
  const { counts } = countEvaluations(context);
  context._internal.RootSlots.map.name.setValue('Ann');
  expect(evaluatedIds(counts)).toEqual(['greeting', 'name']);
  expect(context._internal.RootSlots.map.greeting.propertiesEval.output).toEqual({
    content: 'Hello Ann',
  });
});

test('a block records its operator reads and the engine reads for its own value', async () => {
  const context = await trackingContext({ lowdefy: { pageId }, pageConfig: formPage });
  const { greeting, name } = context._internal.RootSlots.map;
  expect([...greeting.reads]).toEqual(['state:name']);
  expect(greeting.alwaysEvaluate).toBe(null);
  expect([...name.reads]).toEqual(['state:name']);
  expect(name.alwaysEvaluate).toBe(null);
});

test('update without changes is a full pass that evaluates every block', async () => {
  const context = await trackingContext({ lowdefy: { pageId }, pageConfig: formPage });
  const { counts } = countEvaluations(context);
  context._internal.update();
  expect(evaluatedIds(counts)).toEqual(['echo', 'greeting', 'name', 'other', 'root', 'static']);
});

test('update with no changes evaluates no block', async () => {
  const context = await trackingContext({ lowdefy: { pageId }, pageConfig: formPage });
  const { counts } = countEvaluations(context);
  context._internal.update({ changes: [] });
  expect(evaluatedIds(counts)).toEqual([]);
});

test('changes reported without an update carry into the next update', async () => {
  const context = await trackingContext({ lowdefy: { pageId }, pageConfig: formPage });
  const { counts } = countEvaluations(context);
  context._internal.State.set('other', 'written');
  context._internal.update({ changes: [] });
  expect(evaluatedIds(counts)).toEqual(['echo', 'other']);
  expect(context._internal.RootSlots.map.echo.propertiesEval.output).toEqual({
    content: 'written',
  });
});

test('a republish write in updateState carries into the next update, as with a full pass', async () => {
  const run = async (tracking) => {
    const context = await trackingContext({ lowdefy: { pageId }, pageConfig: formPage, tracking });
    context._internal.RootSlots.map.other.setValue('kept');
    // Deleting the field leaves the input's in-memory value, which updateState writes back.
    context._internal.State.del('other');
    context._internal.update({ changes: [] });
    const afterDelete = context._internal.RootSlots.map.echo.propertiesEval.output;
    context._internal.update({ changes: [] });
    const afterNext = context._internal.RootSlots.map.echo.propertiesEval.output;
    return { afterDelete, afterNext, state: context.state };
  };
  const tracked = await run(true);
  expect(tracked).toEqual(await run(false));
  expect(tracked.afterDelete).toEqual({ content: null });
  expect(tracked.afterNext).toEqual({ content: 'kept' });
});

test('SetState evaluates the blocks that read the paths it set', async () => {
  const context = await trackingContext({ lowdefy: { pageId }, pageConfig: formPage });
  const { counts } = countEvaluations(context);
  setState(context, { other: 'set' });
  expect(evaluatedIds(counts)).toEqual(['echo', 'other']);
  expect(context._internal.RootSlots.map.other.value).toEqual('set');
});

test('SetState with nothing to set is a full pass', async () => {
  const context = await trackingContext({ lowdefy: { pageId }, pageConfig: formPage });
  const { counts } = countEvaluations(context);
  setState(context, {});
  expect(evaluatedIds(counts)).toEqual(['echo', 'greeting', 'name', 'other', 'root', 'static']);
});

test('a parser that records nothing leaves blocks with operators evaluating on every pass', async () => {
  const context = await trackingContext({
    lowdefy: { pageId },
    pageConfig: formPage,
    recording: 'none',
  });
  const { echo, greeting, name, root } = context._internal.RootSlots.map;
  expect(greeting.alwaysEvaluate).toEqual('operators reported no reads');
  expect(echo.alwaysEvaluate).toEqual('operators reported no reads');
  // No operators: literal config and engine reads only, so safely tracked.
  expect(name.alwaysEvaluate).toBe(null);
  expect(root.alwaysEvaluate).toBe(null);

  const { counts } = countEvaluations(context);
  context._internal.RootSlots.map.other.setValue('typed');
  expect(evaluatedIds(counts)).toEqual(['echo', 'greeting', 'other']);
  expect(echo.propertiesEval.output).toEqual({ content: 'typed' });
});

test('a block whose operators are all pure is tracked when the parser signals its calls', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    blocks: [
      { id: 'a', type: 'TextInput' },
      {
        id: 'total',
        type: 'Paragraph',
        properties: { content: { _sum: [1, { _divide: [4, 2] }] } },
      },
    ],
  };
  const run = async (recording) => {
    const context = await trackingContext({ lowdefy: { pageId }, pageConfig, recording });
    const { total } = context._internal.RootSlots.map;
    const { counts } = countEvaluations(context);
    context._internal.RootSlots.map.a.setValue('typed');
    return {
      alwaysEvaluate: total.alwaysEvaluate,
      content: total.propertiesEval.output.content,
      evaluated: evaluatedIds(counts),
    };
  };
  const stub = await run('stub');
  expect(stub).toEqual({ alwaysEvaluate: null, content: 3, evaluated: ['a'] });
  expect(await run('parser')).toEqual(stub);
  // A parser that never signals: the same config is evaluated on every pass.
  expect(await run('none')).toEqual({
    alwaysEvaluate: 'operators reported no reads',
    content: 3,
    evaluated: ['a', 'total'],
  });
});

test('an untracked operator makes its block evaluate on every pass', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    blocks: [
      { id: 'a', type: 'TextInput' },
      {
        id: 'matches',
        type: 'Paragraph',
        properties: { content: { '_mql.test': { on: { x: 1 }, test: { x: 1 } } } },
      },
    ],
  };
  const context = await trackingContext({ lowdefy: { pageId }, pageConfig });
  expect(context._internal.RootSlots.map.matches.alwaysEvaluate).toEqual('untracked: _mql');
  const { counts } = countEvaluations(context);
  context._internal.update({ changes: [] });
  expect(evaluatedIds(counts)).toEqual(['matches']);
});

test('switching tracking off makes every update a full pass', async () => {
  const run = async ({ lowdefy, tracking }) => {
    const context = await trackingContext({ lowdefy, pageConfig: formPage, tracking });
    const { counts } = countEvaluations(context);
    context._internal.RootSlots.map.name.setValue('Ann');
    return evaluatedIds(counts);
  };
  const all = ['echo', 'greeting', 'name', 'other', 'root', 'static'];
  // The app's config.dependencyTracking, carried in appMeta.
  expect(await run({ lowdefy: { pageId, lowdefyApp: { dependencyTracking: false } } })).toEqual(
    all
  );
  // The engine option lowdefy._internal.dependencyTracking.
  expect(await run({ lowdefy: { pageId }, tracking: false })).toEqual(all);
  // The session switch.
  const window = { __lowdefyFullEvaluation: true };
  expect(await run({ lowdefy: { pageId, _internal: { globals: { window } } } })).toEqual(all);
});

test('a visibility change evaluates the whole subtree, which never reads the flag itself', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    blocks: [
      {
        id: 'box',
        type: 'Box',
        visible: { _state: 'show' },
        blocks: [
          { id: 'inner', type: 'TextInput' },
          { id: 'label', type: 'Paragraph', properties: { content: 'static' } },
        ],
      },
      { id: 'static', type: 'Paragraph', properties: { content: 'static' } },
    ],
  };
  const context = await trackingContext({ lowdefy: { pageId }, pageConfig });
  const { box, inner, label } = context._internal.RootSlots.map;
  expect(box.visibleEval.output).toBe(null);
  const { counts, reset } = countEvaluations(context);

  setState(context, { show: false });
  expect(evaluatedIds(counts)).toEqual(['box', 'inner', 'label']);
  expect(inner.visibleEval.output).toBe(false);
  expect(label.visibleEval.output).toBe(false);

  reset();
  setState(context, { show: true });
  expect(evaluatedIds(counts)).toEqual(['box', 'inner', 'label']);
  expect(label.visibleEval.output).toBe(true);
  expect(label.propertiesEval.output).toEqual({ content: 'static' });
});

test('a block hidden by its parent has a known, empty read set', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    blocks: [
      {
        id: 'box',
        type: 'Box',
        visible: false,
        blocks: [{ id: 'echo', type: 'Paragraph', properties: { content: { _state: 'x' } } }],
      },
    ],
  };
  const context = await trackingContext({ lowdefy: { pageId }, pageConfig });
  const { echo } = context._internal.RootSlots.map;
  expect(echo.alwaysEvaluate).toBe(null);
  expect([...echo.reads]).toEqual([]);
  const { counts } = countEvaluations(context);
  setState(context, { x: 1 });
  expect(evaluatedIds(counts)).toEqual([]);
});

const listPage = {
  id: 'root',
  type: 'Box',
  blocks: [
    {
      id: 'list',
      type: 'List',
      visible: { _not: { _state: 'hideList' } },
      blocks: [
        { id: 'list.$.name', type: 'TextInput' },
        {
          id: 'list.$.label',
          type: 'Paragraph',
          properties: { content: { _state: 'list.$.name' } },
        },
      ],
    },
    { id: 'static', type: 'Paragraph', properties: { content: 'static' } },
  ],
};

function labels(context) {
  return context._internal.RootSlots.map.list.subSlots.map(
    (_, i) => context._internal.RootSlots.map[`list.${i}.label`].propertiesEval.output.content
  );
}

test('a row move evaluates the moved rows, whose recorded reads named the old row', async () => {
  const context = await trackingContext({ lowdefy: { pageId }, pageConfig: listPage });
  setState(context, { list: [{ name: 'a' }, { name: 'b' }, { name: 'c' }] });
  expect(labels(context)).toEqual(['a', 'b', 'c']);
  const { counts } = countEvaluations(context);

  context._internal.RootSlots.map.list.moveItemDown(0);
  expect(labels(context)).toEqual(['b', 'a', 'c']);
  expect(counts.static).toBe(undefined);

  context._internal.RootSlots.map.list.removeItem(0);
  expect(labels(context)).toEqual(['a', 'c']);

  context._internal.RootSlots.map.list.unshiftItem({ name: 'z' });
  expect(labels(context)).toEqual(['z', 'a', 'c']);

  context._internal.RootSlots.map.list.pushItem({ name: 'y' });
  expect(labels(context)).toEqual(['z', 'a', 'c', 'y']);
  expect(counts.static).toBe(undefined);
});

test('a hidden list captures a SetState of its rows, so showing it restores the new rows', async () => {
  const run = async (tracking) => {
    const context = await trackingContext({ lowdefy: { pageId }, pageConfig: listPage, tracking });
    setState(context, { list: [{ name: 'old' }] });
    setState(context, { hideList: true });
    setState(context, { list: [{ name: 'new1' }, { name: 'new2' }] });
    setState(context, { hideList: false });
    return snapshot(context);
  };
  const tracked = await run(true);
  expect(tracked).toEqual(await run(false));
  expect(JSON.parse(tracked.state).list).toEqual([{ name: 'new1' }, { name: 'new2' }]);
});

const validationPage = {
  id: 'root',
  type: 'Box',
  blocks: [
    {
      id: 'field',
      type: 'TextInput',
      validate: [
        { pass: { _eq: [{ _state: 'field' }, 'ok'] }, status: 'error', message: 'error rule' },
        { pass: { _eq: [{ _state: 'field' }, 'ok'] }, status: 'warning', message: 'warning rule' },
      ],
    },
    { id: 'other', type: 'TextInput' },
  ],
};

test('ResetValidation after Validate shows the warning on the next tracked update', async () => {
  const run = async (tracking) => {
    const context = await trackingContext({
      lowdefy: { pageId },
      pageConfig: validationPage,
      tracking,
    });
    const statuses = [];
    const field = context._internal.RootSlots.map.field;
    context._internal.RootSlots.validate(() => true);
    statuses.push(field.validationEval.output.status);
    context._internal.RootSlots.resetValidation(() => true);
    context._internal.RootSlots.map.other.setValue('unrelated');
    statuses.push(field.validationEval.output.status);
    return statuses;
  };
  expect(await run(true)).toEqual(['error', 'warning']);
  expect(await run(false)).toEqual(['error', 'warning']);
});

test('a required block records i18n for its default required message', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    blocks: [
      { id: 'a', type: 'TextInput', required: true },
      { id: 'b', type: 'TextInput', required: 'Custom message' },
    ],
  };
  const context = await trackingContext({ lowdefy: { pageId }, pageConfig });
  const { a, b } = context._internal.RootSlots.map;
  expect([...a.reads].sort()).toEqual(['i18n', 'state:a']);
  expect([...b.reads].sort()).toEqual(['state:b']);
});

test('a genuine visibility oscillation repeats up to the cap in tracked passes', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    blocks: [{ id: 'a', type: 'TextInput', visible: { _not: { _type: 'string' } } }],
  };
  const run = async (tracking) => {
    const context = await trackingContext({ lowdefy: { pageId }, pageConfig, tracking });
    let passes = 0;
    const { evalFromRoot } = context._internal.RootSlots;
    context._internal.RootSlots.evalFromRoot = (options) => {
      passes += 1;
      return evalFromRoot(options);
    };
    context._internal.RootSlots.map.a.setValue('x');
    return { passes, snapshot: snapshot(context) };
  };
  const tracked = await run(true);
  expect(tracked.passes).toBe(21);
  expect(tracked).toEqual(await run(false));
});

test('an event whose actions only report their changes ends with a tracked update', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    blocks: [
      {
        id: 'button',
        type: 'Button',
        events: { onClick: [{ id: 'set', type: 'SetState', params: { other: 'clicked' } }] },
      },
      ...formPage.blocks,
    ],
  };
  const context = await trackingContext({ lowdefy: { pageId }, pageConfig });
  const { counts } = countEvaluations(context);
  await context._internal.RootSlots.map.button.triggerEvent({ name: 'onClick' });
  expect(counts.static).toBe(undefined);
  expect(counts.echo).toBe(1);
});

test('an action method that cannot report its changes makes the next update a full pass', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    blocks: [
      {
        id: 'button',
        type: 'Button',
        events: { onClick: [{ id: 'session', type: 'RefreshSession' }] },
      },
      ...formPage.blocks,
    ],
  };
  const lowdefy = {
    pageId,
    _internal: {
      actions: { RefreshSession: ({ methods }) => methods.updateSession() },
      auth: { updateSession: async () => ({}) },
    },
  };
  const context = await trackingContext({ lowdefy, pageConfig });
  const { counts } = countEvaluations(context);
  await context._internal.RootSlots.map.button.triggerEvent({ name: 'onClick' });
  expect(counts.static).toBe(1);
});

test('request start and completion update the blocks that read the request', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    requests: [{ id: 'r1', type: 'Fetch', payload: {} }],
    blocks: formPage.blocks,
  };
  const lowdefy = {
    pageId,
    _internal: { callRequest: async () => ({ response: { rows: 1 } }) },
  };
  const context = await trackingContext({ lowdefy, pageConfig });
  const updates = [];
  const { update } = context._internal;
  context._internal.update = (options) => {
    updates.push(options);
    update(options);
  };
  await context._internal.Requests.callRequests({ params: 'r1' });
  expect(updates).toEqual([{ changes: ['request:r1'] }, { changes: ['request:r1'] }]);
});

test('an input keeps the identity of its state value across a SetState that does not touch it', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    blocks: [
      { id: 'tags', type: 'MultipleSelector' },
      { id: 'other', type: 'TextInput' },
    ],
  };
  const run = async (tracking) => {
    const context = await trackingContext({ lowdefy: { pageId }, pageConfig, tracking });
    context._internal.RootSlots.map.tags.setValue(['a']);
    const before = context.state.tags;
    // RootSlots.reset hands every input a copy of its value; the value sync points it back.
    setState(context, { other: 'x' });
    return {
      stateKept: context.state.tags === before,
      valueKept: context._internal.RootSlots.map.tags.value === before,
    };
  };
  expect(await run(true)).toEqual({ stateKept: true, valueKept: true });
  expect(await run(false)).toEqual({ stateKept: true, valueKept: true });
});
