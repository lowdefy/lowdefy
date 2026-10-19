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

import insertAtSelection from './insertAtSelection.js';

test('insertAtSelection puts words into an empty text without a space', () => {
  expect(
    insertAtSelection({ text: '', selection: { start: 0, end: 0 }, insert: 'Hello there' })
  ).toEqual({ text: 'Hello there', cursor: 11 });
});

test('insertAtSelection adds no space after a space', () => {
  expect(
    insertAtSelection({ text: 'Looks good. ', selection: { start: 12, end: 12 }, insert: 'Thanks' })
  ).toEqual({ text: 'Looks good. Thanks', cursor: 18 });
});

test('insertAtSelection adds no space after a new line', () => {
  expect(
    insertAtSelection({ text: 'Hi\n', selection: { start: 3, end: 3 }, insert: 'Sam' })
  ).toEqual({ text: 'Hi\nSam', cursor: 6 });
});

test('insertAtSelection adds a space after a word', () => {
  expect(
    insertAtSelection({ text: 'Looks good.', selection: { start: 11, end: 11 }, insert: 'Thanks' })
  ).toEqual({ text: 'Looks good. Thanks', cursor: 18 });
});

test('insertAtSelection splits a word with a space before the words when the cursor is mid-word', () => {
  expect(
    insertAtSelection({ text: 'gatelog', selection: { start: 4, end: 4 }, insert: 'access' })
  ).toEqual({ text: 'gate accesslog', cursor: 11 });
});

test('insertAtSelection replaces the selected text', () => {
  expect(
    insertAtSelection({
      text: 'Check the gate log today',
      selection: { start: 10, end: 18 },
      insert: 'fence',
    })
  ).toEqual({ text: 'Check the fence today', cursor: 15 });
});

test('insertAtSelection adds a space when the replaced selection follows a word', () => {
  expect(
    insertAtSelection({ text: 'Check thegate', selection: { start: 9, end: 13 }, insert: 'fence' })
  ).toEqual({ text: 'Check the fence', cursor: 15 });
});

test('insertAtSelection adds no space before words that start with a comma or a full stop', () => {
  expect(
    insertAtSelection({ text: 'the gate', selection: { start: 8, end: 8 }, insert: ', then' })
  ).toEqual({ text: 'the gate, then', cursor: 14 });
  expect(
    insertAtSelection({ text: 'the gate', selection: { start: 8, end: 8 }, insert: '. Then' })
  ).toEqual({ text: 'the gate. Then', cursor: 14 });
});

test('insertAtSelection puts words at the end of the text without a selection', () => {
  expect(insertAtSelection({ text: 'Hi', insert: 'Sam' })).toEqual({ text: 'Hi Sam', cursor: 6 });
});

test('insertAtSelection leaves the text and selection alone when there are no words', () => {
  expect(
    insertAtSelection({ text: 'Check the gate', selection: { start: 6, end: 9 }, insert: '' })
  ).toEqual({ text: 'Check the gate', cursor: 9 });
});
