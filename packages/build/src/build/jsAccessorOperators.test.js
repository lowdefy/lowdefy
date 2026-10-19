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

import { _js as clientJs } from '@lowdefy/operators-js/operators/client';
import { _js as serverJs } from '@lowdefy/operators-js/operators/server';

import jsAccessorOperators from './jsAccessorOperators.js';

// Runs the real _js operator with a function that calls every accessor it is
// given, and records which operators those accessors reach.
function operatorsCalledByAccessors(js) {
  const called = new Set();
  const operators = new Proxy(
    {},
    {
      get: (_, name) => {
        called.add(name);
        return () => null;
      },
    }
  );
  const jsMap = {
    fn: (accessors) =>
      Object.values(accessors)
        .filter((accessor) => typeof accessor === 'function')
        .forEach((accessor) => accessor('x')),
  };
  js({ jsMap, operators, params: 'fn' });
  return [...called].sort();
}

test.each([
  ['client', clientJs],
  ['server', serverJs],
])('jsAccessorOperators.%s lists every operator the _js accessors call', (runtime, js) => {
  expect(operatorsCalledByAccessors(js)).toEqual([...jsAccessorOperators[runtime]].sort());
});
