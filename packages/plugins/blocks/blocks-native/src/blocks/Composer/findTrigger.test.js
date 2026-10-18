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

import findTrigger from './findTrigger.js';

const text = (value) => [{ kind: 'text', text: value }];
const sam = { kind: 'mention', id: 'u1', name: 'Sam', sees: true };

test('findTrigger opens the mention picker for an @ at the start of the text', () => {
  expect(findTrigger({ segments: text('@'), cursor: 1 })).toEqual({
    kind: 'mention',
    at: 0,
    query: '',
  });
});

test('findTrigger reads the query typed after an @ that follows whitespace or a bracket', () => {
  expect(findTrigger({ segments: text('Thanks @sa'), cursor: 10 })).toEqual({
    kind: 'mention',
    at: 7,
    query: 'sa',
  });
  expect(findTrigger({ segments: text('(@ad'), cursor: 4 })).toEqual({
    kind: 'mention',
    at: 1,
    query: 'ad',
  });
  expect(findTrigger({ segments: text('line one\n@ge'), cursor: 12 })).toEqual({
    kind: 'mention',
    at: 9,
    query: 'ge',
  });
});

test('findTrigger allows a space inside the query, so a full name can be typed', () => {
  expect(findTrigger({ segments: text('@Sam To'), cursor: 7 })).toEqual({
    kind: 'mention',
    at: 0,
    query: 'Sam To',
  });
});

test('findTrigger opens nothing for an @ inside a word, such as an email address', () => {
  expect(findTrigger({ segments: text('mail sam@example'), cursor: 16 })).toBeNull();
});

test('findTrigger opens nothing when the query starts with whitespace', () => {
  expect(findTrigger({ segments: text('@ hello'), cursor: 7 })).toBeNull();
});

test('findTrigger reads only the text before the cursor', () => {
  expect(findTrigger({ segments: text('@sam is here'), cursor: 4 })).toEqual({
    kind: 'mention',
    at: 0,
    query: 'sam',
  });
  expect(findTrigger({ segments: text('@sam is here.'), cursor: 4 })).toEqual({
    kind: 'mention',
    at: 0,
    query: 'sam',
  });
});

test('findTrigger closes the mention picker past 40 characters of query', () => {
  const query = 'x'.repeat(41);
  expect(findTrigger({ segments: text(`@${query}`), cursor: 42 })).toBeNull();
});

test('findTrigger does not open the picker on the @Name a mention shows', () => {
  expect(findTrigger({ segments: [{ kind: 'text', text: 'Hi ' }, sam], cursor: 7 })).toBeNull();
});

test('findTrigger opens the mention picker for an @ typed after a mention and a space', () => {
  const segments = [sam, { kind: 'text', text: ' @a' }];
  expect(findTrigger({ segments, cursor: 7 })).toEqual({ kind: 'mention', at: 5, query: 'a' });
});

test('findTrigger opens the link picker for an open [[', () => {
  expect(findTrigger({ segments: text('See [['), cursor: 6 })).toEqual({
    kind: 'link',
    at: 4,
    query: '',
  });
  expect(findTrigger({ segments: text('See [[PEL-1'), cursor: 11 })).toEqual({
    kind: 'link',
    at: 4,
    query: 'PEL-1',
  });
});

test('findTrigger opens nothing once the link is closed', () => {
  expect(findTrigger({ segments: text('See [[PEL-1]] '), cursor: 14 })).toBeNull();
});
