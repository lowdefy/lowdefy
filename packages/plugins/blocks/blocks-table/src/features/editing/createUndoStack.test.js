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

import createUndoStack from './createUndoStack.js';

const a = ['a'];
const b = ['b'];
const c = ['c'];

test('undo returns the rows before the last change and redo the rows after it', () => {
  const stack = createUndoStack();
  stack.push({ before: a, after: b });
  stack.push({ before: b, after: c });
  expect(stack.undo(c)).toBe(b);
  expect(stack.undo(b)).toBe(a);
  expect(stack.undo(a)).toBe(null);
  expect(stack.redo(a)).toBe(b);
  expect(stack.redo(b)).toBe(c);
  expect(stack.redo(c)).toBe(null);
});

test('a new change after an undo clears the redo history', () => {
  const stack = createUndoStack();
  stack.push({ before: a, after: b });
  expect(stack.undo(b)).toBe(a);
  stack.push({ before: a, after: c });
  expect(stack.redo(c)).toBe(null);
  expect(stack.undo(c)).toBe(a);
});

test('undo clears the history when the current rows are not the ones the change produced', () => {
  const stack = createUndoStack();
  stack.push({ before: a, after: b });
  stack.push({ before: b, after: c });
  const changedOutside = ['x'];
  expect(stack.undo(changedOutside)).toBe(null);
  expect(stack.size).toEqual({ past: 0, future: 0 });
});

test('redo clears the history when the rows changed after the undo', () => {
  const stack = createUndoStack();
  stack.push({ before: a, after: b });
  stack.undo(b);
  expect(stack.redo(['x'])).toBe(null);
  expect(stack.size).toEqual({ past: 0, future: 0 });
});

test('the history keeps only the last `limit` changes', () => {
  const stack = createUndoStack({ limit: 2 });
  const d = ['d'];
  stack.push({ before: a, after: b });
  stack.push({ before: b, after: c });
  stack.push({ before: c, after: d });
  expect(stack.size.past).toBe(2);
  expect(stack.undo(d)).toBe(c);
  expect(stack.undo(c)).toBe(b);
  expect(stack.undo(b)).toBe(null);
});
