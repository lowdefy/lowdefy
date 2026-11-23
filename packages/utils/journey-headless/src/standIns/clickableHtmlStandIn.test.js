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

import runTestJourney, { readLog, record } from '../tests/runTestJourney.js';

const CARDS = [
  '<div data-event="onOpen" data-id="issue-1" data-record-id="9">Issue 1',
  ' <button data-event="onMerge" data-id="issue-1">Merge</button></div>',
  '<div data-event="onOpen" data-id="issue-2">Issue 2',
  ' <button data-event="onMerge" data-id="issue-2">Merge</button></div>',
  '<span data-event="onAdd">Add</span>',
  '<span data-event="onUnlisted" data-id="issue-1">Not listed</span>',
  '<span data-event="onOpen" data-id="issue-3" hidden>Hidden</span>',
].join('');

function cardsPage({
  dataEvents = ['onOpen', 'onMerge', 'onAdd'],
  events = {},
  html = CARDS,
} = {}) {
  return {
    id: 'home',
    blocks: [
      {
        id: 'cards',
        type: 'ClickableHtml',
        properties: { dataEvents, html },
        events: {
          onOpen: [record('onOpen')],
          onMerge: [record('onMerge')],
          onAdd: [record('onAdd')],
          onUnlisted: [record('onUnlisted')],
          ...events,
        },
      },
    ],
  };
}

test('ClickableHtml fires the event of the element named by control and rowKey, with its data-* attributes as the event', async () => {
  const { log, result } = await runTestJourney({
    pages: [cardsPage()],
    steps: [
      { click: { blockId: 'cards', control: 'onOpen', rowKey: 'issue-1' } },
      { click: { blockId: 'cards', control: 'onMerge', rowKey: 'issue-2' } },
      { click: { blockId: 'cards', control: 'onAdd' } },
    ],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log)).toEqual([
    ['onOpen', { id: 'issue-1', record_id: '9' }],
    ['onMerge', { id: 'issue-2' }],
    ['onAdd', {}],
  ]);
});

test('ClickableHtml fails a target that matches no element, naming the elements it has', async () => {
  const { log, result } = await runTestJourney({
    pages: [cardsPage()],
    steps: [{ click: { blockId: 'cards', control: 'onMerge', rowKey: 'issue-9' } }],
  });
  expect(result.passed).toBe(false);
  expect(result.failure.message).toBe(
    'ClickableHtml "cards" has no element with data-event "onMerge" and data-id "issue-9" that its dataEvents lists. It has: onOpen (data-id "issue-1"), onMerge (data-id "issue-1"), onOpen (data-id "issue-2"), onMerge (data-id "issue-2"), onAdd.'
  );
  expect(log).toEqual([]);
});

test('ClickableHtml leaves out an event its dataEvents does not list and an element the html hides', async () => {
  const unlisted = await runTestJourney({
    pages: [cardsPage()],
    steps: [{ click: { blockId: 'cards', control: 'onUnlisted', rowKey: 'issue-1' } }],
  });
  expect(unlisted.result.failure.message).toMatch(
    /^ClickableHtml "cards" has no element with data-event "onUnlisted" and data-id "issue-1"/
  );
  const hidden = await runTestJourney({
    pages: [cardsPage()],
    steps: [{ click: { blockId: 'cards', control: 'onOpen', rowKey: 'issue-3' } }],
  });
  expect(hidden.result.failure.message).toMatch(
    /^ClickableHtml "cards" has no element with data-event "onOpen" and data-id "issue-3"/
  );
  expect([...readLog(unlisted.log), ...readLog(hidden.log)]).toEqual([]);
});

test('ClickableHtml fails a target that matches several elements', async () => {
  const { log, result } = await runTestJourney({
    pages: [cardsPage()],
    steps: [{ click: { blockId: 'cards', control: 'onMerge' } }],
  });
  expect(result.failure.message).toBe(
    'ClickableHtml "cards" has 2 elements with data-event "onMerge"; give each its own data-id and name it with rowKey.'
  );
  expect(log).toEqual([]);
});

test('ClickableHtml refuses a rowKey with no control, and a column', async () => {
  const rowKeyOnly = await runTestJourney({
    pages: [cardsPage()],
    steps: [{ click: { blockId: 'cards', rowKey: 'issue-1' } }],
  });
  expect(rowKeyOnly.result.failure.message).toBe(
    'ClickableHtml "cards" names its elements by event: add control (the element\'s data-event) beside rowKey (its data-id).'
  );
  const column = await runTestJourney({
    pages: [cardsPage()],
    steps: [{ click: { blockId: 'cards', rowKey: 'issue-1', column: 'name', control: 'onOpen' } }],
  });
  expect(column.result.failure.message).toBe(
    'ClickableHtml "cards" draws no grid columns: "column" names a cell of a grid.'
  );
});

test('ClickableHtml reaches an element in popover content a trigger opens', async () => {
  const html =
    '<span data-popover="more">More</span><div data-popover-content="more" hidden><p data-event="onDelete" data-id="42">Delete</p></div><div data-popover-content="orphan" hidden><p data-event="onDelete" data-id="43">Delete</p></div>';
  const { log, result } = await runTestJourney({
    pages: [
      cardsPage({ dataEvents: ['onDelete'], html, events: { onDelete: [record('onDelete')] } }),
    ],
    steps: [
      { click: { blockId: 'cards', control: 'onDelete', rowKey: '42' } },
      { expect: { hidden: { blockId: 'cards', control: 'onDelete', rowKey: '42' } } },
    ],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log)).toEqual([['onDelete', { id: '42' }]]);
  const orphan = await runTestJourney({
    pages: [cardsPage({ dataEvents: ['onDelete'], html })],
    steps: [{ click: { blockId: 'cards', control: 'onDelete', rowKey: '43' } }],
  });
  expect(orphan.result.passed).toBe(false);
});

test('ClickableHtml asks before an event its dataEvents confirms: ok fires it, cancel drops it', async () => {
  const page = cardsPage({ dataEvents: [{ name: 'onMerge', confirm: 'Merge?' }, 'onOpen'] });
  const ok = await runTestJourney({
    pages: [page],
    steps: [
      { click: { blockId: 'cards', control: 'onMerge', rowKey: 'issue-1' } },
      { expect: { visible: { blockId: 'cards', control: 'ok' } } },
      { click: { blockId: 'cards', control: 'ok' } },
      { expect: { hidden: { blockId: 'cards', control: 'ok' } } },
    ],
  });
  expect(ok.result.passed).toBe(true);
  expect(readLog(ok.log)).toEqual([['onMerge', { id: 'issue-1' }]]);
  const cancel = await runTestJourney({
    pages: [page],
    steps: [
      { click: { blockId: 'cards', control: 'onMerge', rowKey: 'issue-1' } },
      { click: { blockId: 'cards', control: 'cancel' } },
      { click: { blockId: 'cards', control: 'ok' } },
    ],
  });
  expect(cancel.result.failure.message).toMatch(
    /^ClickableHtml "cards" has no element with data-event "ok" that its dataEvents lists\. No confirm of it is open\./
  );
  expect(readLog(cancel.log)).toEqual([]);
});

test('ClickableHtml asks before an element with data-confirm, and a click elsewhere closes the confirm', async () => {
  const html =
    '<button data-event="onDelete" data-id="7" data-confirm="Delete 7?">Delete</button><span data-event="onOpen" data-id="7">Open</span>';
  const { log, result } = await runTestJourney({
    pages: [
      cardsPage({
        dataEvents: ['onDelete', 'onOpen'],
        html,
        events: { onDelete: [record('onDelete')] },
      }),
    ],
    steps: [
      { click: { blockId: 'cards', control: 'onDelete', rowKey: '7' } },
      { click: { blockId: 'cards', control: 'onOpen', rowKey: '7' } },
      { expect: { hidden: { blockId: 'cards', control: 'ok' } } },
    ],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log)).toEqual([['onOpen', { id: '7' }]]);
});

test('ClickableHtml expect.visible and expect.hidden read the html as it changes', async () => {
  const { result } = await runTestJourney({
    pages: [
      {
        id: 'home',
        blocks: [
          {
            id: 'cards',
            type: 'ClickableHtml',
            properties: { dataEvents: ['onRemove'], html: { _state: 'html' } },
            events: {
              onMount: [
                {
                  id: 'set',
                  type: 'SetState',
                  params: {
                    html: '<p data-event="onRemove" data-id="a">A</p><p data-event="onRemove" data-id="b">B</p>',
                  },
                },
              ],
              onRemove: [
                {
                  id: 'remove',
                  type: 'SetState',
                  params: { html: '<p data-event="onRemove" data-id="b">B</p>' },
                },
              ],
            },
          },
        ],
      },
    ],
    steps: [
      { expect: { visible: { blockId: 'cards', control: 'onRemove', rowKey: 'a' } } },
      { click: { blockId: 'cards', control: 'onRemove', rowKey: 'a' } },
      { expect: { hidden: { blockId: 'cards', control: 'onRemove', rowKey: 'a' } } },
      { expect: { visible: { blockId: 'cards', control: 'onRemove', rowKey: 'b' } } },
    ],
  });
  expect(result.passed).toBe(true);
});

test('ClickableHtml expect.visible fails on a missing element and on several', async () => {
  const missing = await runTestJourney({
    pages: [cardsPage()],
    steps: [{ expect: { visible: { blockId: 'cards', control: 'onOpen', rowKey: 'issue-9' } } }],
  });
  expect(missing.result.failure.message).toBe(
    'Expected ClickableHtml "cards" element with data-event "onOpen" and data-id "issue-9" to be visible.'
  );
  const several = await runTestJourney({
    pages: [cardsPage()],
    steps: [{ expect: { visible: { blockId: 'cards', control: 'onOpen' } } }],
  });
  expect(several.result.failure.message).toBe(
    'Expected ClickableHtml "cards" element with data-event "onOpen" to be visible, and matched 2 elements; give each its own data-id and name it with rowKey.'
  );
});

test('ClickableHtml prefers a shown element to one in a popover, and else takes the first popover that holds one', async () => {
  const html =
    '<button data-event="onArchive" data-id="1">Archive</button><span data-popover="m1">More</span><div data-popover-content="m1" hidden><p data-event="onArchive" data-id="1">Archive</p><p data-event="onRestore" data-id="1">Restore</p></div><span data-popover="m2">More</span><div data-popover-content="m2" hidden><p data-event="onRestore" data-id="2">Restore</p></div>';
  const { log, result } = await runTestJourney({
    pages: [
      cardsPage({
        dataEvents: ['onArchive', 'onRestore'],
        html,
        events: { onArchive: [record('onArchive')], onRestore: [record('onRestore')] },
      }),
    ],
    steps: [
      { click: { blockId: 'cards', control: 'onArchive', rowKey: '1' } },
      { click: { blockId: 'cards', control: 'onRestore' } },
    ],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log)).toEqual([
    ['onArchive', { id: '1' }],
    ['onRestore', { id: '1' }],
  ]);
});

test('ClickableHtml refuses a disabled element', async () => {
  const { log, result } = await runTestJourney({
    pages: [
      cardsPage({ html: '<button data-event="onMerge" data-id="p1" disabled>Merge</button>' }),
    ],
    steps: [{ click: { blockId: 'cards', control: 'onMerge', rowKey: 'p1' } }],
  });
  expect(result.failure.message).toBe(
    'The element with data-event "onMerge" and data-id "p1" in ClickableHtml "cards" is disabled.'
  );
  expect(log).toEqual([]);
});

test('ClickableHtml closes an open confirm when its html changes', async () => {
  const { log, result } = await runTestJourney({
    pages: [
      {
        id: 'home',
        blocks: [
          {
            id: 'cards',
            type: 'ClickableHtml',
            properties: {
              dataEvents: [{ name: 'onDelete', confirm: true }],
              html: { _state: 'html' },
            },
            events: {
              onMount: [
                {
                  id: 'set',
                  type: 'SetState',
                  params: { html: '<button data-event="onDelete" data-id="1">Delete</button>' },
                },
              ],
              onDelete: [record('onDelete')],
            },
          },
          {
            id: 'refresh',
            type: 'Button',
            events: {
              onClick: [
                {
                  id: 'refresh_html',
                  type: 'SetState',
                  params: { html: '<button data-event="onDelete" data-id="1">Delete 1</button>' },
                },
              ],
            },
          },
        ],
      },
    ],
    steps: [
      { click: { blockId: 'cards', control: 'onDelete', rowKey: '1' } },
      { expect: { visible: { blockId: 'cards', control: 'ok' } } },
      { click: 'refresh' },
      { expect: { hidden: { blockId: 'cards', control: 'ok' } } },
    ],
  });
  expect(result.passed).toBe(true);
  expect(log).toEqual([]);
});
