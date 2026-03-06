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

import collectDynamicIdentifiers from './collectDynamicIdentifiers.js';

test('collectDynamicIdentifiers returns empty Set for all static operators', () => {
  const staticOp1 = () => {};
  staticOp1.dynamic = false;

  const staticOp2 = () => {};
  staticOp2.dynamic = false;

  const operators = {
    _static1: staticOp1,
    _static2: staticOp2,
  };

  const result = collectDynamicIdentifiers({ operators });
  expect(result.size).toBe(0);
});

test('collectDynamicIdentifiers collects dynamic operators', () => {
  const staticOp = () => {};
  staticOp.dynamic = false;

  const dynamicOp = () => {};
  dynamicOp.dynamic = true;

  const operators = {
    _static: staticOp,
    _dynamic: dynamicOp,
  };

  const result = collectDynamicIdentifiers({ operators });
  expect(result.size).toBe(1);
  expect(result.has('_dynamic')).toBe(true);
  expect(result.has('_static')).toBe(false);
});

test('collectDynamicIdentifiers collects dynamic methods from meta', () => {
  const mathOp = () => {};
  mathOp.dynamic = false;
  mathOp.meta = {
    abs: { singleArg: true },
    ceil: { singleArg: true },
    random: { noArgs: true, dynamic: true },
  };

  const operators = {
    _math: mathOp,
  };

  const result = collectDynamicIdentifiers({ operators });
  expect(result.size).toBe(1);
  expect(result.has('_math.random')).toBe(true);
  expect(result.has('_math')).toBe(false);
  expect(result.has('_math.abs')).toBe(false);
});

test('collectDynamicIdentifiers collects both operator-level and method-level dynamic', () => {
  const dynamicOp = () => {};
  dynamicOp.dynamic = true;

  const mathOp = () => {};
  mathOp.dynamic = false;
  mathOp.meta = {
    abs: { singleArg: true },
    random: { noArgs: true, dynamic: true },
  };

  const dateOp = () => {};
  dateOp.dynamic = false;
  dateOp.meta = {
    now: { noArgs: true, dynamic: true },
    format: { singleArg: true },
  };

  const operators = {
    _state: dynamicOp,
    _math: mathOp,
    _date: dateOp,
  };

  const result = collectDynamicIdentifiers({ operators });
  expect(result.size).toBe(3);
  expect(result.has('_state')).toBe(true);
  expect(result.has('_math.random')).toBe(true);
  expect(result.has('_date.now')).toBe(true);
});

test('collectDynamicIdentifiers ignores non-function values', () => {
  const dynamicOp = () => {};
  dynamicOp.dynamic = true;

  const operators = {
    _dynamic: dynamicOp,
    someString: 'not a function',
    someNumber: 42,
  };

  const result = collectDynamicIdentifiers({ operators });
  expect(result.size).toBe(1);
  expect(result.has('_dynamic')).toBe(true);
});
