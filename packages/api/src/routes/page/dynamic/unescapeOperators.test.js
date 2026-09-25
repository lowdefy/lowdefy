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

import unescapeOperators from './unescapeOperators.js';

test('unescapeOperators strips one underscore from an operator key', () => {
  expect(unescapeOperators({ html: { __state: 'a' }, deep: { ___args: 0 } })).toEqual({
    html: { _state: 'a' },
    deep: { __args: 0 },
  });
});

test('unescapeOperators unescapes operators inside arrays and operator params', () => {
  expect(unescapeOperators([{ __if: { test: { __state: 'a' }, then: 1, else: 2 } }])).toEqual([
    { _if: { test: { _state: 'a' }, then: 1, else: 2 } },
  ]);
});

test('unescapeOperators leaves double-underscore keys of ordinary objects unchanged', () => {
  expect(unescapeOperators({ record: { __typename: 'Product', name: 'Chair' } })).toEqual({
    record: { __typename: 'Product', name: 'Chair' },
  });
});
