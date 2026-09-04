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

import compileExpression from './compileExpression.js';
import isExpression from './isExpression.js';

test('isExpression recognises a scalar that is exactly one ${ … }', () => {
  expect(isExpression('${ state.x }')).toBe(true);
  expect(isExpression('${state.x}')).toBe(true);
  expect(isExpression('  ${ state.x }  ')).toBe(true);
  expect(isExpression("${ state.a == '}' }")).toBe(true);
});

test('isExpression leaves a v7 literal that merely contains ${ … } a literal', () => {
  expect(isExpression('${HOME}/data')).toBe(false);
  expect(isExpression('${a} ${b}')).toBe(false);
  expect(isExpression('text ${x}')).toBe(false);
  expect(isExpression('${ state.a } trailing')).toBe(false);
  expect(isExpression('${ state.a }}')).toBe(false);
});

test('isExpression treats an unterminated ${ as a literal, not an error', () => {
  expect(isExpression('${ state.x')).toBe(false);
  expect(isExpression('${')).toBe(false);
});

test('isExpression is false for the $${ escape and for non-strings', () => {
  expect(isExpression('$${ state.x }')).toBe(false);
  expect(isExpression(5)).toBe(false);
  expect(isExpression(null)).toBe(false);
  expect(isExpression(undefined)).toBe(false);
  expect(isExpression({ _state: 'x' })).toBe(false);
});

test('every scalar isExpression accepts is one compileExpression can delimit', () => {
  // The two must not disagree: a recognised scalar with a malformed body is a
  // hard error, so recognition must never accept what the compiler refuses to
  // delimit.
  expect(() => compileExpression({ expression: '${ state.x }' })).not.toThrow();
  expect(compileExpression({ expression: "${ state.a == '}' }" })).toEqual({
    _eq: [{ _state: 'a' }, '}'],
  });
});

test('isExpression treats an empty or whitespace-only string as a literal', () => {
  expect(isExpression('')).toBe(false);
  expect(isExpression('   ')).toBe(false);
});
