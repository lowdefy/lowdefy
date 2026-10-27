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

import insertLink from './insertLink.js';
import insertMention from './insertMention.js';
import { toDisplay, toValue } from './segmentText.js';

const format = '[[user:{id}]]';
const sam = { value: 'u1', label: 'Sam Taylor', sees: true };

test('insertMention replaces the @ and query with the mention token and a space', () => {
  const segments = [{ kind: 'text', text: 'Thanks @sa' }];
  const result = insertMention({ segments, at: 7, cursor: 10, person: sam });
  expect(toValue({ segments: result.segments, format })).toBe('Thanks [[user:u1]] ');
  expect(toDisplay(result.segments)).toBe('Thanks @Sam Taylor ');
  expect(result.cursor).toBe(19);
});

test('insertMention adds no space when whitespace already follows, and steps over it', () => {
  const segments = [{ kind: 'text', text: '@sa please' }];
  const result = insertMention({ segments, at: 0, cursor: 3, person: sam });
  expect(toValue({ segments: result.segments, format })).toBe('[[user:u1]] please');
  expect(result.cursor).toBe(12);
});

test('insertMention writes the token in a custom mention format', () => {
  const segments = [{ kind: 'text', text: '@' }];
  const result = insertMention({ segments, at: 0, cursor: 1, person: sam });
  expect(toValue({ segments: result.segments, format: '<@{id}>' })).toBe('<@u1> ');
});

test('insertLink replaces the open [[ and query with the record link and a space', () => {
  const segments = [{ kind: 'text', text: 'See [[acm' }];
  const result = insertLink({ segments, at: 4, cursor: 9, key: 'ACME-12' });
  expect(toDisplay(result.segments)).toBe('See [[ACME-12]] ');
  expect(result.cursor).toBe(16);
});

test('insertLink takes in a ]] that already closes the link', () => {
  const segments = [{ kind: 'text', text: 'See [[acm]] now' }];
  const result = insertLink({ segments, at: 4, cursor: 9, key: 'ACME-12' });
  expect(toDisplay(result.segments)).toBe('See [[ACME-12]] now');
  expect(result.cursor).toBe(16);
});
