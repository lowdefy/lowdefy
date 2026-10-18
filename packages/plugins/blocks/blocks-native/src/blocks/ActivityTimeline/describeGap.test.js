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

import describeGap from './describeGap.js';
import summariseEvents from './summariseEvents.js';

const names = (segments) =>
  segments
    .map((segment) => (segment.kind === 'actor' ? `<${segment.name}>` : segment.text))
    .join('');

test('describeGap counts the changes and names up to three actors', () => {
  expect(names(describeGap({ gap: { count: 1 } }))).toBe('1 earlier change');
  expect(names(describeGap({ gap: { count: 2, actors: [{ name: 'A' }] } }))).toBe(
    '2 earlier changes by <A>'
  );
  expect(names(describeGap({ gap: { count: 5, actors: [{ name: 'A' }, { name: 'B' }] } }))).toBe(
    '5 earlier changes by <A> and <B>'
  );
  expect(
    names(describeGap({ gap: { count: 9, actors: [{ name: 'A' }, { name: 'B' }, { name: 'C' }] } }))
  ).toBe('9 earlier changes by <A>, <B> and <C>');
});

test('describeGap names two actors and counts the rest past three', () => {
  const actors = ['A', 'B', 'C', 'D'].map((name) => ({ name }));
  expect(names(describeGap({ gap: { count: 14, actors } }))).toBe(
    '14 earlier changes by <A>, <B> and 2 others'
  );
});

test('describeGap uses the gap text when the gap has one', () => {
  expect(names(describeGap({ gap: { count: 3, text: '3 hidden updates' } }))).toBe(
    '3 hidden updates'
  );
});

test('summariseEvents says made N changes for events with no summary of their own', () => {
  expect(summariseEvents({ entries: [{ type: 'a' }, { type: 'b' }, { type: 'a' }] })).toBe(
    'made 3 changes'
  );
  expect(summariseEvents({ entries: [{ type: 'a', summary: 'renamed it' }] })).toBe('renamed it');
});
