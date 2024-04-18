/*
  Copyright 2020-2024 Lowdefy, Inc

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

import countOperators from './countOperators.js';
import createCounter from './createCounter.js';

test('countOperators from null', () => {
  const counter = createCounter();
  countOperators(null, { counter });
  expect(counter.getCounts()).toEqual({});
});

test('countOperators from empty object', () => {
  const counter = createCounter();
  countOperators({}, { counter });
  expect(counter.getCounts()).toEqual({});
});

test('countOperators', () => {
  const counter = createCounter();
  countOperators(
    {
      a: {
        _op_1: {
          a: 1,
        },
      },
      b: {
        _op_1: {
          _op_2: null,
        },
      },
      c: {
        c: {
          d: [{ _op_3: { e: 1 } }, { f: { _op_4: [1] } }],
        },
      },
    },
    { counter }
  );
  expect(counter.getCounts()).toEqual({ _op_1: 2, _op_2: 1, _op_3: 1, _op_4: 1 });
});

test('operator should be object with just one key', () => {
  let counter = createCounter();
  countOperators(
    {
      _op_1: 1,
      _op_2: 2,
    },
    { counter }
  );
  expect(counter.getCounts()).toEqual({});
  counter = createCounter();
  countOperators(
    {
      _op_1: 1,
      x: 2,
    },
    { counter }
  );
  expect(counter.getCounts()).toEqual({});
});
