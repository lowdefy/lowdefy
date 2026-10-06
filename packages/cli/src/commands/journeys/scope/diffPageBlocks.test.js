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

import diffPageBlocks from './diffPageBlocks.js';

function block({ blockId, type = 'Button', properties = {}, k, blocks }) {
  return {
    id: `block:tickets:${blockId}:0`,
    type,
    blockId,
    properties,
    ...(blocks ? { slots: { content: { blocks: { '~arr': blocks } } } } : {}),
    '~k': k ?? blockId,
  };
}

function page({ blocks, typesKey = 't1' }) {
  return {
    id: 'page:tickets',
    type: 'Box',
    pageId: 'tickets',
    blockId: 'tickets',
    typesKey,
    slots: { content: { blocks: { '~arr': blocks } } },
    '~k': 'page',
  };
}

const keyMap = {
  submit: { key: 'root.pages[0:tickets].blocks[1:submit]', '~r': 'r2', '~l': 21 },
  card: { key: 'root.pages[0:tickets].blocks[0:card]', '~r': 'r2', '~l': 9 },
};
const refMap = { r2: { path: 'pages/tickets.yaml', parent: null } };

test('diffPageBlocks lists added, changed and removed blocks with label, type and head source', () => {
  const basePage = page({
    blocks: [
      block({
        blockId: 'card',
        type: 'Card',
        properties: { title: 'Ticket' },
        blocks: [block({ blockId: 'old_note', type: 'Html', properties: { html: 'x' } })],
      }),
      block({ blockId: 'assign', properties: { title: 'Assign' } }),
    ],
  });
  const headPage = page({
    typesKey: 't2',
    blocks: [
      block({
        blockId: 'card',
        type: 'Card',
        properties: { title: 'Ticket details' },
        blocks: [
          block({ blockId: 'title', type: 'TextInput', properties: { label: { title: 'Title' } } }),
        ],
      }),
      block({ blockId: 'assign', properties: { title: 'Assign' }, k: 'moved' }),
      block({ blockId: 'submit', properties: { label: 'Save' } }),
    ],
  });

  expect(diffPageBlocks({ basePage, headPage, keyMap, refMap })).toEqual([
    {
      blockId: 'card',
      type: 'Card',
      change: 'changed',
      label: 'Ticket details',
      source: 'pages/tickets.yaml:9',
    },
    { blockId: 'title', type: 'TextInput', change: 'added', label: null, source: null },
    {
      blockId: 'submit',
      type: 'Button',
      change: 'added',
      label: 'Save',
      source: 'pages/tickets.yaml:21',
    },
    { blockId: 'old_note', type: 'Html', change: 'removed', label: null, source: null },
  ]);
});

test('diffPageBlocks does not mark a container changed when only its children changed', () => {
  const basePage = page({
    blocks: [
      block({
        blockId: 'card',
        type: 'Card',
        blocks: [block({ blockId: 'a', properties: { title: 'A' } })],
      }),
    ],
  });
  const headPage = page({
    blocks: [
      block({
        blockId: 'card',
        type: 'Card',
        blocks: [block({ blockId: 'a', properties: { title: 'B' } })],
      }),
    ],
  });
  expect(
    diffPageBlocks({ basePage, headPage, keyMap, refMap }).map((change) => change.blockId)
  ).toEqual(['a']);
});

test('diffPageBlocks lists every block of a new page as added', () => {
  const headPage = page({ blocks: [block({ blockId: 'submit' })] });
  expect(diffPageBlocks({ basePage: undefined, headPage, keyMap, refMap })).toEqual([
    { blockId: 'tickets', type: 'Box', change: 'added', label: null, source: null },
    {
      blockId: 'submit',
      type: 'Button',
      change: 'added',
      label: null,
      source: 'pages/tickets.yaml:21',
    },
  ]);
});
