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

import validateOperatorsDynamic from './validateOperatorsDynamic.js';

test('validateOperatorsDynamic passes when all operators have dynamic property', () => {
  const staticOp = () => {};
  staticOp.dynamic = false;

  const dynamicOp = () => {};
  dynamicOp.dynamic = true;

  const operators = {
    _static: staticOp,
    _dynamic: dynamicOp,
  };

  expect(() => validateOperatorsDynamic({ operators })).not.toThrow();
});

test('validateOperatorsDynamic throws when operator is missing dynamic property', () => {
  const goodOp = () => {};
  goodOp.dynamic = false;

  const badOp = () => {};
  // No dynamic property

  const operators = {
    _good: goodOp,
    _bad: badOp,
  };

  expect(() => validateOperatorsDynamic({ operators })).toThrow(
    "Operator validation failed: The following operators are missing the 'dynamic' property: _bad"
  );
});

test('validateOperatorsDynamic throws when multiple operators are missing dynamic property', () => {
  const badOp1 = () => {};
  const badOp2 = () => {};

  const operators = {
    _bad1: badOp1,
    _bad2: badOp2,
  };

  expect(() => validateOperatorsDynamic({ operators })).toThrow(
    "Operator validation failed: The following operators are missing the 'dynamic' property: _bad1, _bad2"
  );
});

test('validateOperatorsDynamic ignores non-function values', () => {
  const goodOp = () => {};
  goodOp.dynamic = false;

  const operators = {
    _good: goodOp,
    someString: 'not a function',
    someNumber: 42,
    someObject: { foo: 'bar' },
  };

  expect(() => validateOperatorsDynamic({ operators })).not.toThrow();
});
