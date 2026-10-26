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

import applyDisplayEdit from './applyDisplayEdit.js';
import snapSelection from './snapSelection.js';
import { toDisplay, toValue } from './segmentText.js';

const sam = { kind: 'mention', id: 'u1', name: 'Sam', sees: true };
const format = '[[user:{id}]]';

function edit({ segments, next, selection }) {
  const result = applyDisplayEdit({ segments, previous: toDisplay(segments), next, selection });
  return { ...result, value: toValue({ segments: result.segments, format }) };
}

test('applyDisplayEdit adds typed text to the text around it', () => {
  const segments = [{ kind: 'text', text: 'Hello' }];
  const result = edit({ segments, next: 'Hello!', selection: { start: 5, end: 5 } });
  expect(result.value).toBe('Hello!');
  expect(result.cursor).toBe(6);
  expect(result.natural).toBe(6);
});

test('applyDisplayEdit keeps a mention when text is typed after it', () => {
  const segments = [{ kind: 'text', text: 'Hi ' }, sam];
  const result = edit({ segments, next: 'Hi @Sam,', selection: { start: 7, end: 7 } });
  expect(result.value).toBe('Hi [[user:u1]],');
});

test('applyDisplayEdit removes the whole mention when Backspace deletes its last character', () => {
  const segments = [{ kind: 'text', text: 'Hi ' }, sam, { kind: 'text', text: ' there' }];
  const result = edit({ segments, next: 'Hi @Sa there', selection: { start: 7, end: 7 } });
  expect(result.value).toBe('Hi  there');
  expect(result.cursor).toBe(3);
  expect(result.natural).toBe(6);
});

test('applyDisplayEdit removes the mention, not the equal letter after it, on Backspace', () => {
  // "@Sam" followed by "m": Backspace at the mention's end deletes the mention.
  const segments = [sam, { kind: 'text', text: 'm' }];
  const result = edit({ segments, next: '@Sam', selection: { start: 4, end: 4 } });
  expect(result.value).toBe('m');
  expect(result.cursor).toBe(0);
});

test('applyDisplayEdit removes a mention a selected range only partly covers', () => {
  const segments = [{ kind: 'text', text: 'ab ' }, sam, { kind: 'text', text: ' cd' }];
  const result = edit({ segments, next: 'abam cd', selection: { start: 2, end: 5 } });
  expect(result.value).toBe('ab cd');
  expect(result.cursor).toBe(2);
});

test('applyDisplayEdit puts text typed inside a mention after it', () => {
  const segments = [sam, { kind: 'text', text: ' ok' }];
  const result = edit({ segments, next: '@Sxam ok', selection: { start: 2, end: 2 } });
  expect(result.value).toBe('[[user:u1]]x ok');
  expect(result.cursor).toBe(5);
  expect(result.natural).toBe(3);
});

test('applyDisplayEdit replaces a pasted-over selection of plain text', () => {
  const segments = [{ kind: 'text', text: 'one two three' }];
  const result = edit({ segments, next: 'one 2 three', selection: { start: 4, end: 7 } });
  expect(result.value).toBe('one 2 three');
  expect(result.cursor).toBe(5);
});

test('applyDisplayEdit clears every segment when the text is cleared', () => {
  const segments = [{ kind: 'text', text: 'Hi ' }, sam];
  const result = edit({ segments, next: '', selection: { start: 0, end: 7 } });
  expect(result.segments).toEqual([]);
  expect(result.cursor).toBe(0);
});

test('snapSelection moves a cursor inside a mention to its end', () => {
  const segments = [{ kind: 'text', text: 'Hi ' }, sam];
  expect(snapSelection({ segments, selection: { start: 5, end: 5 } })).toEqual({
    start: 7,
    end: 7,
  });
  const atEdge = { start: 3, end: 3 };
  expect(snapSelection({ segments, selection: atEdge })).toBe(atEdge);
  const range = { start: 4, end: 6 };
  expect(snapSelection({ segments, selection: range })).toBe(range);
});
