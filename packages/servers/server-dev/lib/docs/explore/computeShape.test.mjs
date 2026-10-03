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

import computeShape from './computeShape.js';

const knownText = { has: (text) => ['Assign', 'Save'].includes(text) };

const candidates = [
  { kind: 'click', target: { blockId: 'assign', text: 'Assign' } },
  { kind: 'fill', target: { blockId: 'title' } },
  { kind: 'click', target: { blockId: 'grid', row: 0, text: 'Jane Staging' } },
];

const base = {
  pageId: 'tickets',
  layers: [],
  candidates,
  stateShape: [
    ['title', 'string'],
    ['count', 'number'],
  ],
  knownText,
};

test('computeShape is 8 hex characters and ignores order', () => {
  const shape = computeShape(base);
  expect(shape).toMatch(/^[0-9a-f]{8}$/);
  expect(
    computeShape({
      ...base,
      candidates: [...candidates].reverse(),
      stateShape: [...base.stateShape].reverse(),
    })
  ).toEqual(shape);
});

test('computeShape ignores text that is not known text and state values', () => {
  const shape = computeShape(base);
  const otherRow = candidates.map((candidate) =>
    candidate.target.row === 0
      ? { ...candidate, target: { ...candidate.target, text: 'Grace' } }
      : candidate
  );
  expect(computeShape({ ...base, candidates: otherRow })).toEqual(shape);
});

test('computeShape changes with the page, an open layer, a listed candidate, known text or a state type', () => {
  const shape = computeShape(base);
  expect(computeShape({ ...base, pageId: 'ticket' })).not.toEqual(shape);
  expect(computeShape({ ...base, layers: ['edit_modal'] })).not.toEqual(shape);
  expect(computeShape({ ...base, candidates: candidates.slice(1) })).not.toEqual(shape);
  expect(
    computeShape({
      ...base,
      candidates: [
        { kind: 'click', target: { blockId: 'assign', text: 'Save' } },
        ...candidates.slice(1),
      ],
    })
  ).not.toEqual(shape);
  expect(
    computeShape({
      ...base,
      stateShape: [
        ['title', 'null'],
        ['count', 'number'],
      ],
    })
  ).not.toEqual(shape);
});
