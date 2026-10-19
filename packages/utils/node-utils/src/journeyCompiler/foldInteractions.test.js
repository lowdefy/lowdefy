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

import foldInteractions from './foldInteractions.js';
import traceRecord from './traceRecord.js';

function summary(records) {
  return records.map((record) => {
    const { block_id: block, text } = record.target ?? {};
    return [record.kind, block, text ?? null, record.value ?? null].filter(
      (part) => part !== undefined
    );
  });
}

test('foldInteractions folds a searchable Selector trigger click, typing and pick into the option click', () => {
  const folded = foldInteractions({
    records: [
      traceRecord({ at: 0, block: 'owner' }),
      traceRecord({ at: 1, kind: 'change', block: 'owner', value: 'Gr' }),
      traceRecord({ at: 1.5, kind: 'change', block: 'owner', value: 'Gra' }),
      traceRecord({ at: 2.5, block: 'owner', text: 'Grace', option: true }),
    ],
  });
  expect(summary(folded)).toEqual([['click', 'owner', 'Grace', null]]);
  expect(folded[0].target.option).toBe(true);
});

test('foldInteractions folds AutoComplete typing and pick into the option click', () => {
  const folded = foldInteractions({
    records: [
      traceRecord({ at: 0, kind: 'change', block: 'person', value: 'A' }),
      traceRecord({ at: 0.4, kind: 'change', block: 'person', value: 'Ad' }),
      traceRecord({ at: 1.2, block: 'person', text: 'Ada Lovelace', option: true }),
    ],
  });
  expect(summary(folded)).toEqual([['click', 'person', 'Ada Lovelace', null]]);
});

test('foldInteractions stops a popup pick fold at the previous interaction elsewhere', () => {
  const folded = foldInteractions({
    records: [
      traceRecord({ at: 0, kind: 'change', block: 'owner', value: 'x' }),
      traceRecord({ at: 3, block: 'save' }),
      traceRecord({ at: 6, block: 'owner', text: 'Grace', option: true }),
    ],
  });
  expect(summary(folded)).toEqual([
    ['change', 'owner', null, 'x'],
    ['click', 'save', null, null],
    ['click', 'owner', 'Grace', null],
  ]);
});

test('foldInteractions keeps two CheckboxSelector option clicks as two labelled clicks', () => {
  const folded = foldInteractions({
    records: [
      traceRecord({ at: 0, block: 'days', text: 'Mon' }),
      traceRecord({ at: 0.05, kind: 'change', block: 'days', value: ['Mon'] }),
      traceRecord({ at: 1.5, block: 'days', text: 'Tue' }),
      traceRecord({ at: 1.55, kind: 'change', block: 'days', value: ['Mon', 'Tue'] }),
    ],
  });
  expect(summary(folded)).toEqual([
    ['click', 'days', 'Mon', null],
    ['click', 'days', 'Tue', null],
  ]);
});

test('foldInteractions folds a radio pick as autocapture sends it into one labelled click', () => {
  const folded = foldInteractions({
    records: [
      traceRecord({ at: 0, block: 'plan', text: 'Pro', source: 'production' }),
      traceRecord({ at: 0.01, block: 'plan', source: 'production' }),
      traceRecord({ at: 0.02, kind: 'change', block: 'plan', source: 'production' }),
    ],
  });
  expect(summary(folded)).toEqual([['click', 'plan', 'Pro', null]]);
});

test('foldInteractions collapses keystroke changes into one with the last value and event', () => {
  const lastEvent = { name: 'onChange', block_id: 'title', success: true };
  const folded = foldInteractions({
    records: [
      traceRecord({ at: 0, kind: 'change', block: 'title', value: 'A' }),
      traceRecord({ at: 0.2, kind: 'change', block: 'title', value: 'Ad' }),
      traceRecord({ at: 0.4, kind: 'change', block: 'title', value: 'Ada', event: lastEvent }),
    ],
  });
  expect(folded).toHaveLength(1);
  expect(folded[0]).toMatchObject({
    value: 'Ada',
    event: lastEvent,
    t: '2026-09-28T14:00:00.000Z',
  });
});

test('foldInteractions collapses a change run interleaved with a click elsewhere within 2 s', () => {
  const folded = foldInteractions({
    records: [
      traceRecord({ at: 0, kind: 'change', block: 'title', value: 'a' }),
      traceRecord({ at: 0.5, kind: 'change', block: 'qty', value: 2 }),
      traceRecord({ at: 1, kind: 'change', block: 'title', value: 'ab' }),
      traceRecord({ at: 1.5, kind: 'change', block: 'qty', value: 25 }),
    ],
  });
  expect(summary(folded)).toEqual([
    ['change', 'title', null, 'ab'],
    ['change', 'qty', null, 25],
  ]);
});

test('foldInteractions starts a new change run after a gap of more than 2 s', () => {
  const folded = foldInteractions({
    records: [
      traceRecord({ at: 0, kind: 'change', block: 'title', value: 'a' }),
      traceRecord({ at: 2.5, kind: 'change', block: 'title', value: 'ab' }),
    ],
  });
  expect(folded).toHaveLength(2);
});

test('foldInteractions drops a focus click before a fill but keeps a labelled click', () => {
  const folded = foldInteractions({
    records: [
      traceRecord({ at: 0, block: 'title' }),
      traceRecord({ at: 1, kind: 'change', block: 'title', value: 'x' }),
      traceRecord({ at: 5, block: 'plan', text: 'Pro' }),
      traceRecord({ at: 7, kind: 'change', block: 'plan', value: 'pro' }),
    ],
  });
  expect(summary(folded)).toEqual([
    ['change', 'title', null, 'x'],
    ['click', 'plan', 'Pro', null],
    ['change', 'plan', null, 'pro'],
  ]);
});

test('foldInteractions collapses a double click and keeps its rage frustration', () => {
  const folded = foldInteractions({
    records: [
      traceRecord({ at: 0, block: 'save', source: 'production' }),
      traceRecord({ at: 0.3, block: 'save', source: 'production', frustration: 'rage' }),
      traceRecord({ at: 0.6, block: 'save', source: 'production' }),
    ],
  });
  expect(folded).toHaveLength(1);
  expect(folded[0].frustration).toBe('rage');
});

test('foldInteractions keeps clicks on the same target more than 1 s apart', () => {
  const folded = foldInteractions({
    records: [traceRecord({ at: 0, block: 'next' }), traceRecord({ at: 1.5, block: 'next' })],
  });
  expect(folded).toHaveLength(2);
});

test('foldInteractions drops pageleave records', () => {
  const folded = foldInteractions({
    records: [traceRecord({ at: 0, block: 'save' }), traceRecord({ at: 1, kind: 'pageleave' })],
  });
  expect(summary(folded)).toEqual([['click', 'save', null, null]]);
});

test('foldInteractions does not mutate its input records', () => {
  const records = [
    traceRecord({ at: 0, kind: 'change', block: 'title', value: 'a' }),
    traceRecord({ at: 0.5, kind: 'change', block: 'title', value: 'ab' }),
  ];
  const copy = JSON.parse(JSON.stringify(records));
  foldInteractions({ records });
  expect(records).toEqual(copy);
});
