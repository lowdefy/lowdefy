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

import applyManagerRegions from './applyManagerRegions.js';
import buildManagerSequence from './buildManagerSequence.js';
import getManagerEntries from './getManagerEntries.js';
import moveSequenceEntry from './moveSequenceEntry.js';
import sequenceToRegions from './sequenceToRegions.js';

const state = {
  columnOrder: ['a', 'b', 'h', 'c', 'd'],
  columnPinning: { start: ['b'], end: ['d'] },
  columnVisibility: { h: false },
};

function ids(sequence) {
  return sequence.map((entry) => entry.key ?? `|${entry.boundary}`);
}

test('getManagerEntries lists visible columns in table order, then hidden ones', () => {
  expect(getManagerEntries({ state })).toEqual({
    start: ['b'],
    center: ['a', 'c'],
    end: ['d'],
    hidden: ['h'],
  });
});

test('buildManagerSequence places the pinned boundaries between the regions', () => {
  expect(ids(buildManagerSequence(getManagerEntries({ state })))).toEqual([
    'b',
    '|start',
    'a',
    'c',
    '|end',
    'd',
  ]);
});

test('moveSequenceEntry moves an entry to an insertion position', () => {
  const sequence = buildManagerSequence(getManagerEntries({ state }));
  expect(ids(moveSequenceEntry({ sequence, from: 3, to: 0 }))).toEqual([
    'c',
    'b',
    '|start',
    'a',
    '|end',
    'd',
  ]);
  expect(ids(moveSequenceEntry({ sequence, from: 0, to: 4 }))).toEqual([
    '|start',
    'a',
    'c',
    'b',
    '|end',
    'd',
  ]);
  expect(moveSequenceEntry({ sequence, from: 2, to: 3 })).toBe(sequence);
});

test('sequenceToRegions reads pinning from the boundaries, even when they cross', () => {
  const sequence = buildManagerSequence(getManagerEntries({ state }));
  expect(sequenceToRegions(sequence)).toEqual({ start: ['b'], center: ['a', 'c'], end: ['d'] });
  const dragged = moveSequenceEntry({ sequence, from: 1, to: 4 });
  expect(sequenceToRegions(dragged)).toEqual({ start: ['b', 'a', 'c'], center: [], end: ['d'] });
  // Past the end boundary, the start boundary pins every column above it.
  const crossed = moveSequenceEntry({ sequence, from: 1, to: 6 });
  expect(sequenceToRegions(crossed)).toEqual({ start: ['b', 'a', 'c', 'd'], center: [], end: [] });
});

test('applyManagerRegions reorders visible columns around hidden ones and keeps hidden pins', () => {
  const next = applyManagerRegions({
    state: { ...state, columnPinning: { start: ['h', 'b'], end: ['d'] } },
    regions: { start: [], center: ['c', 'b', 'a'], end: ['d'] },
  });
  expect(next).toEqual({
    columnOrder: ['c', 'b', 'h', 'a', 'd'],
    columnPinning: { start: ['h'], end: ['d'] },
  });
});
