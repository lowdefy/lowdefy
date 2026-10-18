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

import rankMentions from './rankMentions.js';

const people = [
  { value: 'u1', label: 'Mark Adams', sees: true },
  { value: 'u2', label: 'Sam Tolmay', sees: true },
  { value: 'u3', label: 'Amara Samuels', sees: true },
  { value: 'u4', label: 'Samantha Blind', sees: false },
  { value: 'u5', label: 'Rosamund Pike', sees: true },
];

test('rankMentions puts a name that starts with the query first, then a word start, then the rest', () => {
  expect(rankMentions({ people, query: 'sam' }).map((person) => person.value)).toEqual([
    'u2',
    'u3',
    'u5',
  ]);
});

test('rankMentions ignores case', () => {
  expect(rankMentions({ people, query: 'ADA' }).map((person) => person.value)).toEqual(['u1']);
});

test('rankMentions offers only people who see the record', () => {
  expect(rankMentions({ people, query: 'blind' })).toEqual([]);
});

test('rankMentions offers everyone who sees the record, in order, for an empty query', () => {
  expect(rankMentions({ people, query: '' }).map((person) => person.value)).toEqual([
    'u1',
    'u2',
    'u3',
    'u5',
  ]);
});

test('rankMentions offers at most limit people, 8 by default', () => {
  const many = Array.from({ length: 12 }, (_, i) => ({
    value: `p${i}`,
    label: `Person ${i}`,
    sees: true,
  }));
  expect(rankMentions({ people: many, query: 'person' })).toHaveLength(8);
  expect(rankMentions({ people: many, query: 'person', limit: 3 })).toHaveLength(3);
});
