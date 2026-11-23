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

import runTestJourney, { methodButton, readLog, record } from '../tests/runTestJourney.js';

const COMPANIES = [
  { label: 'Audit Avis', value: 'avis' },
  { label: 'Audit Bravo', value: 'bravo' },
];

// The headless select fires onChange with no event value yet (LDF-1138), so the log reads
// ['onChange'] where a browser gives { value }.

// A picker whose onSearch loads its options, as a page that searches a list on the server does:
// the options are [] until a search sets them, after a trailing-edge debounce.
function pickerPage({ type = 'Selector', properties = {}, debounce = { ms: 300 } } = {}) {
  return {
    id: 'home',
    blocks: [
      {
        id: 'company',
        type,
        properties: { options: { _state: 'company_options' }, ...properties },
        events: {
          onChange: [record('onChange')],
          onSearch: {
            try: [
              record('onSearch'),
              { id: 'load', type: 'SetState', params: { company_options: COMPANIES } },
            ],
            debounce,
          },
        },
      },
      { id: 'note', type: 'TextInput', events: { onChange: [record('note.onChange')] } },
      { id: 'done', type: 'Button', events: { onClick: [record('done.onClick')] } },
    ],
  };
}

test('a fill on a Selector fires onSearch with the text and leaves its value alone', async () => {
  const { log, result } = await runTestJourney({
    pages: [pickerPage()],
    steps: [
      { fill: { blockId: 'company', value: 'Audit' } },
      { expect: { state: { path: 'company', equals: null } } },
    ],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log)).toEqual([['onSearch', { value: 'Audit' }]]);
});

test('a fill waits for a debounced onSearch, so the select after it finds the options it loads', async () => {
  const { log, result } = await runTestJourney({
    pages: [pickerPage()],
    steps: [
      { fill: { blockId: 'company', value: 'Audit' } },
      { select: { blockId: 'company', value: 'Audit Avis' } },
      { expect: { state: { path: 'company', equals: 'avis' } } },
    ],
  });
  expect(result.passed).toBe(true);
  // The pick clears the search with no onSearch, so the closing dropdown fires none either.
  expect(readLog(log)).toEqual([['onSearch', { value: 'Audit' }], ['onChange']]);
});

test('a select with no search first fails on a Selector whose options a search loads', async () => {
  const { result } = await runTestJourney({
    pages: [pickerPage()],
    steps: [{ select: { blockId: 'company', value: 'Audit Avis' } }],
  });
  expect(result.passed).toBe(false);
  expect(result.failure.message).toContain('has no option "Audit Avis"');
});

test('a click elsewhere after a search closes a Selector, whose onSearch clears the search after the click', async () => {
  const { log, result } = await runTestJourney({
    pages: [pickerPage({ debounce: null })],
    steps: [{ fill: { blockId: 'company', value: 'Audit' } }, { click: 'done' }],
  });
  expect(result.passed).toBe(true);
  // rc-select closes a single select a task after the mousedown, so the click's event starts first.
  expect(readLog(log)).toEqual([
    ['onSearch', { value: 'Audit' }],
    ['done.onClick'],
    ['onSearch', { value: '' }],
  ]);
});

test('a click elsewhere runs first when a debounce delays the onSearch that clears the search', async () => {
  const { log, result } = await runTestJourney({
    pages: [pickerPage()],
    steps: [{ fill: { blockId: 'company', value: 'Audit' } }, { click: 'done' }],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log)).toEqual([
    ['onSearch', { value: 'Audit' }],
    ['done.onClick'],
    ['onSearch', { value: '' }],
  ]);
});

test('a fill of another input after a search blurs a Selector, whose onSearch clears the search after the typing', async () => {
  const { log, result } = await runTestJourney({
    pages: [pickerPage({ debounce: null })],
    steps: [
      { fill: { blockId: 'company', value: 'Audit' } },
      { fill: { blockId: 'note', value: 'Call back' } },
    ],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log)).toEqual([
    ['onSearch', { value: 'Audit' }],
    ['note.onChange'],
    ['onSearch', { value: '' }],
  ]);
});

test('a MultipleSelector fill fires onSearch, and the focus leaving clears the search with no event', async () => {
  const { log, result } = await runTestJourney({
    pages: [pickerPage({ type: 'MultipleSelector', debounce: null })],
    steps: [
      { fill: { blockId: 'company', value: 'Audit' } },
      { select: { blockId: 'company', value: 'Audit Bravo' } },
      { click: 'done' },
      { expect: { state: { path: 'company', equals: ['bravo'] } } },
    ],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log)).toEqual([['onSearch', { value: 'Audit' }], ['onChange'], ['done.onClick']]);
});

test('a MultipleSelector that keeps its search after a pick still fires nothing as it closes', async () => {
  const { log, result } = await runTestJourney({
    pages: [
      pickerPage({
        type: 'MultipleSelector',
        properties: { autoClearSearchValue: false },
        debounce: null,
      }),
    ],
    steps: [
      { fill: { blockId: 'company', value: 'Audit' } },
      { select: { blockId: 'company', value: 'Audit Bravo' } },
      { click: 'done' },
    ],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log)).toEqual([['onSearch', { value: 'Audit' }], ['onChange'], ['done.onClick']]);
});

test('a TreeMultipleSelector clears a search it kept with onSearch as the focus leaves', async () => {
  const { log, result } = await runTestJourney({
    pages: [
      pickerPage({
        type: 'TreeMultipleSelector',
        properties: { autoClearSearchValue: false },
        debounce: null,
      }),
    ],
    steps: [
      { fill: { blockId: 'company', value: 'Audit' } },
      { select: { blockId: 'company', value: 'Audit Bravo' } },
      { click: 'done' },
    ],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log)).toEqual([
    ['onSearch', { value: 'Audit' }],
    ['onChange'],
    ['onSearch', { value: '' }],
    ['done.onClick'],
  ]);
});

test('a TreeSelector fill fires onSearch with the text', async () => {
  const { log, result } = await runTestJourney({
    pages: [pickerPage({ type: 'TreeSelector', debounce: null })],
    steps: [{ fill: { blockId: 'company', value: 'Audit' } }],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log)).toEqual([['onSearch', { value: 'Audit' }]]);
});

test('a fill of the text already searched fires nothing, as the search box does not change', async () => {
  const { log, result } = await runTestJourney({
    pages: [pickerPage({ debounce: null })],
    steps: [
      { fill: { blockId: 'company', value: 'Audit' } },
      { fill: { blockId: 'company', value: 'Audit' } },
      { fill: { blockId: 'company', value: 'Audit B' } },
    ],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log)).toEqual([
    ['onSearch', { value: 'Audit' }],
    ['onSearch', { value: 'Audit B' }],
  ]);
});

test('a fill types a number as text, as the browser does', async () => {
  const { log } = await runTestJourney({
    pages: [pickerPage({ debounce: null })],
    steps: [{ fill: { blockId: 'company', value: 42 } }],
  });
  expect(readLog(log)).toEqual([['onSearch', { value: '42' }]]);
});

test('a fill on a Selector with showSearch false fails: its search box is read-only', async () => {
  const { log, result } = await runTestJourney({
    pages: [pickerPage({ properties: { showSearch: false } })],
    steps: [{ fill: { blockId: 'company', value: 'Audit' } }],
  });
  expect(result.passed).toBe(false);
  expect(result.failure.index).toBe(0);
  expect(result.failure.message).toBe(
    'The search box in block "company" (Selector) is read-only (showSearch is false), so fill cannot type into it: select picks its option.'
  );
  expect(log).toEqual([]);
});

test('a fill on a disabled Selector fails', async () => {
  const { log, result } = await runTestJourney({
    pages: [pickerPage({ properties: { disabled: true } })],
    steps: [{ fill: { blockId: 'company', value: 'Audit' } }],
  });
  expect(result.passed).toBe(false);
  expect(result.failure.message).toBe('The input in block "company" (Selector) is disabled.');
  expect(log).toEqual([]);
});

test('Enter after a search fill needs the browser, where it picks the highlighted option', async () => {
  const { log, result } = await runTestJourney({
    pages: [pickerPage({ debounce: null })],
    steps: [
      { fill: { blockId: 'note', value: 'Call back' } },
      { fill: { blockId: 'company', value: 'Audit' } },
      { press: 'Enter' },
    ],
  });
  expect(result.browserOnly).toEqual({
    index: 2,
    step: { press: 'Enter' },
    reason:
      'Block "company" is of type Selector, which has no headless stand-in for press "Enter": the step runs in a browser.',
  });
  expect(readLog(log)).toEqual([['note.onChange'], ['onSearch', { value: 'Audit' }]]);
});

test('a select after a search refuses an option the search hides, as the browser shows none', async () => {
  const { result } = await runTestJourney({
    pages: [
      pickerPage({
        properties: { options: [...COMPANIES, { label: 'Zulu Ltd', value: 'zulu' }] },
        debounce: null,
      }),
    ],
    steps: [
      { fill: { blockId: 'company', value: 'audit' } },
      { select: { blockId: 'company', value: 'Zulu Ltd' } },
    ],
  });
  expect(result.passed).toBe(false);
  expect(result.failure.index).toBe(1);
  expect(result.failure.message).toBe(
    'No option with text "Zulu Ltd" appeared in the dropdown of block "company": the search "audit" hides it.'
  );
});

test('a select after a search matches the search against the option filterString, case ignored', async () => {
  const { result } = await runTestJourney({
    pages: [
      pickerPage({
        properties: {
          options: [{ label: 'Zulu Ltd', value: 'zulu', filterString: 'Zulu Ltd zulu.invalid' }],
        },
        debounce: null,
      }),
    ],
    steps: [
      { fill: { blockId: 'company', value: 'ZULU.INV' } },
      { select: { blockId: 'company', value: 'Zulu Ltd' } },
      { expect: { state: { path: 'company', equals: 'zulu' } } },
    ],
  });
  expect(result.passed).toBe(true);
});

test('a fill the browser refuses moves no focus, so a searching selector keeps its search', async () => {
  const page = pickerPage({ debounce: null });
  page.blocks.push({ id: 'locked', type: 'TextInput', properties: { disabled: true } });
  const { log, result } = await runTestJourney({
    pages: [page],
    steps: [
      { fill: { blockId: 'company', value: 'Audit' } },
      { fill: { blockId: 'locked', value: 'x' } },
    ],
  });
  expect(result.passed).toBe(false);
  expect(result.failure.index).toBe(1);
  expect(readLog(log)).toEqual([['onSearch', { value: 'Audit' }]]);
});

test('a CallMethod on a searching selector, such as setData, needs the browser', async () => {
  const page = pickerPage({ debounce: null });
  page.blocks.push(methodButton({ id: 'load', blockId: 'company', method: 'setData' }));
  const { result } = await runTestJourney({ pages: [page], steps: [{ click: 'load' }] });
  expect(result.browserOnly).toEqual({
    index: 0,
    step: { click: 'load' },
    reason:
      'Block "company" is of type Selector, which has no headless stand-in for CallMethod setData: the step runs in a browser.',
  });
});
