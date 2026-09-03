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

import { serializer } from '@lowdefy/helpers';

import compileExpression from './compileExpression.js';
import stampPosition from './stampPosition.js';

const expression = '${ state.a == 1 && len(state.b) > 0 }';

function stamped() {
  return stampPosition({
    tree: compileExpression({ expression }),
    line: 7,
    column: 12,
    expression,
  });
}

test('stampPosition marks every node with ~l and ~c', () => {
  const tree = stamped();
  expect(tree['~l']).toBe(7);
  expect(tree['~c']).toBe(12);
  expect(tree._and[0]['~l']).toBe(7);
  expect(tree._and[0]['~c']).toBe(12);
  expect(tree._and[0]._eq['~l']).toBe(7);
  expect(tree._and[1]._gt[0]['~l']).toBe(7);
  expect(tree._and[1]._gt[0]['~c']).toBe(12);
});

test('stampPosition markers are non-enumerable so they are invisible to the build', () => {
  const tree = stamped();
  expect(Object.keys(tree)).toEqual(['_and']);
  expect(JSON.parse(JSON.stringify(tree))).toEqual({
    _and: [{ _eq: [{ _state: 'a' }, 1] }, { _gt: [{ '_array.length': { _state: 'b' } }, 0] }],
  });
});

test('stampPosition puts ~x on the root only', () => {
  const tree = stamped();
  expect(tree['~x']).toBe(expression);
  expect(tree._and['~x']).toBeUndefined();
  expect(tree._and[0]['~x']).toBeUndefined();
  expect(tree._and[0]._eq[0]['~x']).toBeUndefined();
});

test('stampPosition markers survive serializer.copy', () => {
  const copy = serializer.copy(stamped());
  expect(copy['~l']).toBe(7);
  expect(copy['~c']).toBe(12);
  expect(copy['~x']).toBe(expression);
  expect(copy._and[0]['~c']).toBe(12);
  expect(copy._and[1]._gt[0]['~c']).toBe(12);
  expect(Object.keys(copy)).toEqual(['_and']);
});

test('stampPosition leaves a bare literal tree alone', () => {
  expect(stampPosition({ tree: 5, line: 1, column: 1, expression: '${ 5 }' })).toBe(5);
});
