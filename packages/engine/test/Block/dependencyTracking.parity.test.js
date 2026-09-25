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

import createSetGlobal from '../../src/actions/createSetGlobal.js';
import createSetState from '../../src/actions/createSetState.js';
import DependencyTracker from '../../src/tracking/DependencyTracker.js';
import { captureRenders, snapshot, trackingContext } from '../trackingContext.js';

// The differential oracle: the same script runs against a tracked context and a full-pass context
// built from the same config, and after every step each block's evaluated output, its validation
// display, the state, and the set of blocks React would re-render must match.

let trackerEnabled;
beforeAll(() => {
  trackerEnabled = DependencyTracker.enabled;
  DependencyTracker.enabled = true;
});
afterAll(() => {
  DependencyTracker.enabled = trackerEnabled;
});

const pageConfig = {
  id: 'root',
  type: 'Box',
  blocks: [
    {
      id: 'name',
      type: 'TextInput',
      required: true,
      validate: [
        {
          pass: { _eq: [{ _state: 'name' }, 'Ann'] },
          status: 'warning',
          message: 'Expected Ann',
        },
      ],
    },
    {
      id: 'greeting',
      type: 'Paragraph',
      properties: {
        content: { '_string.concat': ['Hello ', { _if_none: [{ _state: 'name' }, ''] }] },
      },
    },
    { id: 'show', type: 'Switch' },
    {
      id: 'box',
      type: 'Box',
      visible: { _state: 'show' },
      blocks: [
        { id: 'inner', type: 'TextInput', required: true },
        { id: 'innerEcho', type: 'Paragraph', properties: { content: { _state: 'inner' } } },
        { id: 'innerStatic', type: 'Paragraph', properties: { content: 'static' } },
      ],
    },
    { id: 'hideList', type: 'Switch' },
    {
      id: 'list',
      type: 'List',
      visible: { _not: { _state: 'hideList' } },
      blocks: [
        { id: 'list.$.name', type: 'TextInput', required: true },
        {
          id: 'list.$.label',
          type: 'Paragraph',
          properties: { content: { _state: 'list.$.name' } },
        },
        {
          // Reads another namespace through '$': a row move changes the key, not the global.
          id: 'list.$.rowTitle',
          type: 'Paragraph',
          properties: { content: { _global: 'rowTitles.$' } },
        },
        {
          id: 'list.$.global',
          type: 'Paragraph',
          visible: { _global: 'showRowGlobal' },
          properties: { content: { _global: 'title' } },
        },
      ],
    },
    { id: 'summary', type: 'Paragraph', properties: { content: { _state: 'list' } } },
    { id: 'n1', type: 'NumberInput' },
    { id: 'n2', type: 'NumberInput' },
    {
      id: 'total',
      type: 'Paragraph',
      properties: {
        content: {
          _sum: [{ _if_none: [{ _state: 'n1' }, 0] }, { _if_none: [{ _state: 'n2' }, 0] }],
        },
      },
    },
    {
      id: 'typed',
      type: 'Paragraph',
      properties: { content: { _type: { type: 'string', key: 'name' } } },
    },
    {
      id: 'titleGlobal',
      type: 'Paragraph',
      properties: { content: { _global: 'title' } },
    },
    { id: 'static', type: 'Paragraph', properties: { content: 'static' } },
  ],
};

function block(context, blockId) {
  return context._internal.RootSlots.map[blockId];
}

function setState(context, params) {
  createSetState({ arrayIndices: [], context })(params);
}

function setGlobal(context, params) {
  createSetGlobal({ arrayIndices: [], context })(params);
}

const script = [
  ['type into name', (context) => block(context, 'name').setValue('A')],
  ['keep typing', (context) => block(context, 'name').setValue('Ann')],
  ['clear name', (context) => block(context, 'name').setValue('')],
  ['show the box', (context) => setState(context, { show: true })],
  ['type into inner', (context) => block(context, 'inner').setValue('x')],
  [
    'set row titles',
    (context) => setGlobal(context, { rowTitles: ['t0', 't1', 't2', 't3', 't4'] }),
  ],
  [
    'set rows',
    (context) => setState(context, { list: [{ name: 'a' }, { name: 'b' }, { name: 'c' }] }),
  ],
  ['type into a row', (context) => block(context, 'list.1.name').setValue('bb')],
  ['move a row down', (context) => block(context, 'list').moveItemDown(0)],
  ['move a row up', (context) => block(context, 'list').moveItemUp(2)],
  ['remove a row', (context) => block(context, 'list').removeItem(1)],
  ['unshift a row', (context) => block(context, 'list').unshiftItem({ name: 'z' })],
  ['push an empty row', (context) => block(context, 'list').pushItem()],
  ['push a row', (context) => block(context, 'list').pushItem({ name: 'y' })],
  ['set a global', (context) => setGlobal(context, { title: 'Title' })],
  ['show row globals', (context) => setGlobal(context, { showRowGlobal: true })],
  ['hide the list', (context) => setState(context, { hideList: true })],
  ['set rows while hidden', (context) => setState(context, { list: [{ name: 'new' }] })],
  ['show the list', (context) => setState(context, { hideList: false })],
  ['validate', (context) => context._internal.RootSlots.validate(() => true)],
  ['type after validate', (context) => block(context, 'n1').setValue(2)],
  ['reset validation', (context) => context._internal.RootSlots.resetValidation(() => true)],
  ['type after reset validation', (context) => block(context, 'n2').setValue(3)],
  [
    'delete a field outside an update',
    (context) => {
      context._internal.State.del('n1');
      context._internal.update({ changes: [] });
    },
  ],
  ['a flag-only update', (context) => context._internal.update({ changes: [] })],
  ['hide the box', (context) => setState(context, { show: false })],
  ['type into a hidden input', (context) => block(context, 'inner').setValue('hidden')],
  ['show the box again', (context) => setState(context, { show: true })],
  ['refresh with an empty SetState', (context) => setState(context, {})],
  ['a full update', (context) => context._internal.update()],
];

async function runParity({ recording }) {
  const lowdefy = { pageId: 'one', lowdefyGlobal: {} };
  const tracked = await trackingContext({
    lowdefy: { ...lowdefy, lowdefyGlobal: {} },
    pageConfig,
    recording,
  });
  const full = await trackingContext({
    lowdefy: { ...lowdefy, lowdefyGlobal: {} },
    pageConfig,
    recording,
    tracking: false,
  });
  const trackedRenders = captureRenders(tracked);
  const fullRenders = captureRenders(full);
  expect(snapshot(tracked)).toEqual(snapshot(full));
  for (const [step, run] of script) {
    run(tracked);
    run(full);
    expect({ step, ...snapshot(tracked) }).toEqual({ step, ...snapshot(full) });
    expect({ step, renders: [...trackedRenders].sort() }).toEqual({
      step,
      renders: [...fullRenders].sort(),
    });
    trackedRenders.clear();
    fullRenders.clear();
  }
}

test('tracked updates match full passes step by step with stub recording', async () => {
  await runParity({ recording: 'stub' });
});

test('tracked updates match full passes step by step when the parser records nothing', async () => {
  await runParity({ recording: 'none' });
});

test('tracked updates match full passes step by step with the operators own declarations', async () => {
  await runParity({ recording: 'parser' });
});
