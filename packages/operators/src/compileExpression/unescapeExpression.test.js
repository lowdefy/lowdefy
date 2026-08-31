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

import unescapeExpression from './unescapeExpression.js';

test('unescapeExpression removes the leading escape $ from $${ … }', () => {
  expect(unescapeExpression('$${ state.x }')).toBe('${ state.x }');
  expect(unescapeExpression('$${value}')).toBe('${value}');
});

test('unescapeExpression preserves leading whitespace around the escape', () => {
  expect(unescapeExpression('  $${ foo }')).toBe('  ${ foo }');
});

test('unescapeExpression leaves strings without a leading $${ untouched', () => {
  expect(unescapeExpression('${ state.x }')).toBe('${ state.x }');
  expect(unescapeExpression('plain text')).toBe('plain text');
  expect(unescapeExpression('cost is $$5')).toBe('cost is $$5');
  expect(unescapeExpression('text $${ not leading }')).toBe('text $${ not leading }');
});

test('unescapeExpression passes non-strings through unchanged', () => {
  expect(unescapeExpression(5)).toBe(5);
  expect(unescapeExpression(null)).toBe(null);
  expect(unescapeExpression(undefined)).toBe(undefined);
});
