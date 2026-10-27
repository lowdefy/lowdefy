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

import placeDictation from './placeDictation.js';

const sam = { kind: 'mention', id: 'u1', name: 'Sam Taylor', sees: true };

test('placeDictation puts words at the end of an empty text', () => {
  expect(placeDictation({ segments: [], selection: { start: 0, end: 0 }, words: 'Hello' })).toEqual(
    { segments: [{ kind: 'text', text: 'Hello' }], cursor: 5, atEnd: true }
  );
});

test('placeDictation adds a space after a word and none before punctuation', () => {
  const segments = [{ kind: 'text', text: 'Looks good' }];
  expect(placeDictation({ segments, selection: { start: 10, end: 10 }, words: 'ship it' })).toEqual(
    { segments: [{ kind: 'text', text: 'Looks good ship it' }], cursor: 18, atEnd: true }
  );
  expect(placeDictation({ segments, selection: { start: 10, end: 10 }, words: ', then' })).toEqual({
    segments: [{ kind: 'text', text: 'Looks good, then' }],
    cursor: 16,
    atEnd: true,
  });
});

test('placeDictation inserts mid-text and keeps mentions as they are', () => {
  const segments = [sam, { kind: 'text', text: ' see end' }];
  // "@Sam Taylor see| end"
  expect(placeDictation({ segments, selection: { start: 15, end: 15 }, words: 'the' })).toEqual({
    segments: [sam, { kind: 'text', text: ' see the end' }],
    cursor: 19,
    atEnd: false,
  });
});

test('placeDictation replaces a selected range', () => {
  const segments = [{ kind: 'text', text: 'Fix the gate today' }];
  expect(placeDictation({ segments, selection: { start: 8, end: 12 }, words: 'door' })).toEqual({
    segments: [{ kind: 'text', text: 'Fix the door today' }],
    cursor: 12,
    atEnd: false,
  });
});
