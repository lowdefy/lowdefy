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

import { type } from '@lowdefy/helpers';

import createTrackedOperator from './createTrackedOperator.js';

// A live view of the operator registry whose functions record into the active recorder. Operators
// that call other operators through `operators` (the _js accessors, _operator) are recorded too.
// Per-page bundles merge new operators into the registry in place, so every trap reads the registry
// at access time. The proxy target is an empty object, so the registry's own property attributes
// can never violate a proxy invariant.
function createTrackedOperators({ getRecorder, operators }) {
  const wrappers = new Map();

  // Runs on every recorded operator call, so types are tested natively.
  function wrap(operatorName, operatorFn) {
    if (typeof operatorName !== 'string' || typeof operatorFn !== 'function') {
      return operatorFn;
    }
    const cached = wrappers.get(operatorName);
    if (cached?.operatorFn === operatorFn) {
      return cached.wrapper;
    }
    const wrapper = createTrackedOperator({ getRecorder, operatorFn, operatorName });
    wrappers.set(operatorName, { operatorFn, wrapper });
    return wrapper;
  }

  return new Proxy(
    {},
    {
      get(_, operatorName) {
        return wrap(operatorName, operators[operatorName]);
      },
      has(_, operatorName) {
        return operatorName in operators;
      },
      getOwnPropertyDescriptor(_, operatorName) {
        const descriptor = Object.getOwnPropertyDescriptor(operators, operatorName);
        if (type.isUndefined(descriptor)) return undefined;
        return {
          configurable: true,
          enumerable: descriptor.enumerable,
          value: wrap(operatorName, operators[operatorName]),
          writable: false,
        };
      },
      ownKeys() {
        return Reflect.ownKeys(operators);
      },
    }
  );
}

export default createTrackedOperators;
