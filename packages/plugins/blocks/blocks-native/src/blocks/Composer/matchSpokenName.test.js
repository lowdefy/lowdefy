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

import indexSpokenNames from './indexSpokenNames.js';
import matchSpokenName from './matchSpokenName.js';

const names = indexSpokenNames({
  people: [
    { value: 'u1', label: 'Sam Taylor', sees: true },
    { value: 'u2', label: 'Falcon Agent', sees: true },
    { value: 'u3', label: '  Pieter   van Dam ', sees: true },
    { value: 'u4', label: 'Hidden', sees: false },
    { value: 'u5', label: 'No Sees' },
    { label: 'No Id', sees: true },
  ],
});

function match(text) {
  return matchSpokenName({ names, spoken: text.toLowerCase().split(' ').filter(Boolean) });
}

test('indexSpokenNames keeps people who see the record, with their name as lower case words', () => {
  expect(names.map((name) => name.full)).toEqual(['sam taylor', 'falcon agent', 'pieter van dam']);
  expect(names[2].words).toEqual(['pieter', 'van', 'dam']);
});

test('matchSpokenName matches a full name and counts its words', () => {
  expect(match('pieter van dam please')).toMatchObject({ person: { value: 'u3' }, count: 3 });
});

test('matchSpokenName matches a first name as one word', () => {
  expect(match('pieter van der merwe')).toMatchObject({ person: { value: 'u3' }, count: 1 });
  expect(match('sam can')).toMatchObject({ person: { value: 'u1' }, count: 1 });
});

test('matchSpokenName matches a unique prefix of three or more letters of a first name', () => {
  expect(match('fal')).toMatchObject({ person: { value: 'u2' }, count: 1 });
  expect(match('fa')).toBeNull();
  expect(match('tay')).toBeNull();
});

test('matchSpokenName ignores people who do not see the record', () => {
  expect(match('hidden')).toBeNull();
  expect(match('no sees')).toBeNull();
});

test('matchSpokenName matches no one for no words', () => {
  expect(match('')).toBeNull();
});

test('matchSpokenName matches no one for a full name two people share', () => {
  const twins = indexSpokenNames({
    people: [
      { value: 'a', label: 'Sam Taylor', sees: true },
      { value: 'b', label: 'sam taylor', sees: true },
    ],
  });
  expect(matchSpokenName({ names: twins, spoken: ['sam', 'taylor'] })).toBeNull();
});
