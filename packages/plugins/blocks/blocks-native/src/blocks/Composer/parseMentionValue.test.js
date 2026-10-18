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

import createMentionPattern from './createMentionPattern.js';
import parseMentionValue from './parseMentionValue.js';
import { toDisplay, toValue } from './segmentText.js';

const people = new Map([
  ['u1', { label: 'Sam Tolmay', sees: true }],
  ['u2', { label: 'Ada Lovelace', sees: false }],
]);

test('parseMentionValue splits text and mention tokens and names each mention', () => {
  const segments = parseMentionValue({
    value: 'Thanks [[user:u1]], over to [[user:u2]].',
    pattern: createMentionPattern(),
    people,
  });
  expect(segments).toEqual([
    { kind: 'text', text: 'Thanks ' },
    { kind: 'mention', id: 'u1', name: 'Sam Tolmay', sees: true },
    { kind: 'text', text: ', over to ' },
    { kind: 'mention', id: 'u2', name: 'Ada Lovelace', sees: false },
    { kind: 'text', text: '.' },
  ]);
  expect(toDisplay(segments)).toBe('Thanks @Sam Tolmay, over to @Ada Lovelace.');
});

test('parseMentionValue names a token for someone not in people Unknown and keeps its id', () => {
  const segments = parseMentionValue({
    value: '[[user:gone]]',
    pattern: createMentionPattern(),
    people,
  });
  expect(segments).toEqual([{ kind: 'mention', id: 'gone', name: 'Unknown', sees: true }]);
  expect(toValue({ segments, format: '[[user:{id}]]' })).toBe('[[user:gone]]');
});

test('parseMentionValue leaves record links as text', () => {
  const segments = parseMentionValue({
    value: 'See [[PEL-12]]',
    pattern: createMentionPattern(),
    people,
  });
  expect(segments).toEqual([{ kind: 'text', text: 'See [[PEL-12]]' }]);
});

test('parseMentionValue and toValue round trip a value in a custom mention format', () => {
  const format = '<@{id}>';
  const value = 'Ping <@u1> and <@u2>';
  const segments = parseMentionValue({ value, pattern: createMentionPattern(format), people });
  expect(segments.filter((segment) => segment.kind === 'mention')).toHaveLength(2);
  expect(toValue({ segments, format })).toBe(value);
});

test('createMentionPattern takes the word run after a format that ends in {id}', () => {
  const segments = parseMentionValue({
    value: 'hi @u1, bye',
    pattern: createMentionPattern('@{id}'),
    people,
  });
  expect(segments[1]).toEqual({ kind: 'mention', id: 'u1', name: 'Sam Tolmay', sees: true });
  expect(segments[2]).toEqual({ kind: 'text', text: ', bye' });
});

test('createMentionPattern throws for a format without {id}', () => {
  expect(() => createMentionPattern('[[user]]')).toThrow(
    'Mention format must hold "{id}". Received "[[user]]".'
  );
});
