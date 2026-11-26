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

import { expect, test } from 'vitest';

import collectMountOrder, { collectMounts, collectRenderedBlocks } from './collectMountOrder.js';

function block(id, visible = true, { events = {}, type = 'Box', ...rest } = {}) {
  return { id, type, Events: { events }, eval: { visible, ...rest } };
}

// Slots holding `blocks` in one content slot, and each block's children by its id.
function slotsOf(blocks, children = {}) {
  return {
    slots: { content: { blocks } },
    subSlots: Object.fromEntries(
      Object.entries(children).map(([id, [childBlocks, grandChildren]]) => [
        id,
        [slotsOf(childBlocks, grandChildren)],
      ])
    ),
  };
}

const SKELETON = { type: 'Box', id: 'skeleton' };

function ids(blocks) {
  return blocks.map(({ id }) => id);
}

test("collectMountOrder puts children before their block, in config order, and skips a hidden block's subtree", () => {
  const root = block('page');
  const box = block('box');
  const hidden = block('hidden', false);
  const rows = block('rows');
  const slots = {
    slots: { root: { blocks: [root] } },
    subSlots: {
      page: [
        {
          slots: { content: { blocks: [box, hidden, rows] } },
          subSlots: {
            box: [
              { slots: { content: { blocks: [block('title'), block('input')] } }, subSlots: {} },
            ],
            hidden: [{ slots: { content: { blocks: [block('never')] } }, subSlots: {} }],
            rows: [
              { slots: { content: { blocks: [block('rows.0.label')] } }, subSlots: {} },
              { slots: { content: { blocks: [block('rows.1.label')] } }, subSlots: {} },
            ],
          },
        },
      ],
    },
  };
  expect(collectMountOrder({ slots }).map(({ id }) => id)).toEqual([
    'title',
    'input',
    'box',
    'hidden',
    'rows.0.label',
    'rows.1.label',
    'rows',
    'page',
  ]);
});

test('a loading block with an object skeleton mounts no children, and dropped lists its content', () => {
  const frame = block('frame', true, { loading: true, skeleton: SKELETON });
  const slots = slotsOf([frame], {
    frame: [[block('panel'), block('deals')], { panel: [[block('row')]] }],
  });
  const { dropped, mounts } = collectMounts({ slots });
  expect(ids(mounts.map(({ block: mounted }) => mounted))).toEqual(['frame']);
  expect(mounts[0].rendered).toBe(false);
  expect(dropped.map(({ block: holder, content }) => [holder.id, ids(content)])).toEqual([
    ['frame', ['panel', 'row', 'deals']],
  ]);
});

test('a loading block with no skeleton mounts its children, and a skeleton is ignored once loading ends', () => {
  const noSkeleton = block('box', true, { loading: true });
  const loaded = block('loaded', true, { loading: false, skeleton: SKELETON });
  const slots = slotsOf([noSkeleton, loaded], {
    box: [[block('inside')]],
    loaded: [[block('content')]],
  });
  expect(ids(collectMountOrder({ slots }))).toEqual(['inside', 'box', 'content', 'loaded']);
  expect(collectMounts({ slots }).dropped).toEqual([]);
});

test("a parent's loading passes down, so a skeleton below a loading block holds its content back", () => {
  const outer = block('outer', true, { loading: true });
  const inner = block('inner', true, { skeleton: SKELETON });
  const slots = slotsOf([outer], { outer: [[inner], { inner: [[block('held')]] }] });
  expect(ids(collectMountOrder({ slots }))).toEqual(['inner', 'outer']);
  expect(ids(collectRenderedBlocks({ slots }))).toEqual(['outer']);
});

test("a block's own onMount loads it until it finishes (mountFinished)", () => {
  const frame = block('frame', true, { events: { onMount: {} }, skeleton: SKELETON });
  const slots = slotsOf([frame], { frame: [[block('panel')]] });
  expect(ids(collectMountOrder({ slots }))).toEqual(['frame']);
  expect(ids(collectMountOrder({ mountFinished: new Set([frame]), slots }))).toEqual([
    'panel',
    'frame',
  ]);
});

test("a Table's slots keep their own loading", () => {
  const table = block('table', true, { loading: true, type: 'Table' });
  const slots = slotsOf([table], {
    table: [[block('create', true, { skeleton: SKELETON })], { create: [[block('label')]] }],
  });
  expect(ids(collectMountOrder({ slots }))).toEqual(['label', 'create', 'table']);
});

test("a hidden block's content is dropped; a closed Modal's is not, its stand-in unmounts it", () => {
  const modal = block('modal', true, { type: 'Modal' });
  const slots = slotsOf([block('hidden', false), modal], {
    hidden: [[block('never')]],
    modal: [[block('content')]],
  });
  const { dropped } = collectMounts({ slots });
  expect(dropped.map(({ block: holder, content }) => [holder.id, ids(content)])).toEqual([
    ['hidden', ['never']],
  ]);
  expect(ids(collectMountOrder({ openBlocks: new Set(['modal']), slots }))).toEqual([
    'hidden',
    'content',
    'modal',
  ]);
});

test('a loading block whose skeleton is not an object mounts its children, as with none', () => {
  const slots = slotsOf(
    [
      block('text', true, { loading: true, skeleton: 'SkeletonParagraph' }),
      block('list', true, { loading: true, skeleton: [SKELETON] }),
      block('flag', true, { loading: true, skeleton: true }),
    ],
    { text: [[block('a')]], list: [[block('b')]], flag: [[block('c')]] }
  );
  expect(ids(collectMountOrder({ slots }))).toEqual(['a', 'text', 'b', 'list', 'c', 'flag']);
  expect(collectMounts({ slots }).dropped).toEqual([]);
});
