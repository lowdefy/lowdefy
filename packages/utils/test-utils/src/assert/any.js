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

import createMatcher from './createMatcher.js';

const primitiveTypes = new Map([
  [String, 'string'],
  [Number, 'number'],
  [Boolean, 'boolean'],
  [Symbol, 'symbol'],
  [Function, 'function'],
]);

// Matches any value of a type: any(String), any(Number), any(Date), any(Array), any(Object) or
// a class of the app's own. null and undefined match nothing.
function any(constructor) {
  if (typeof constructor !== 'function') {
    throw new TypeError(
      `any() takes a constructor, such as String, Number or Date. Received ${String(constructor)}.`
    );
  }
  return createMatcher({
    description: `any(${constructor.name})`,
    matches: (actual) => {
      if (actual === null || actual === undefined) return false;
      if (primitiveTypes.has(constructor) && typeof actual === primitiveTypes.get(constructor)) {
        return true;
      }
      if (constructor === Object) return typeof actual === 'object';
      return actual instanceof constructor;
    },
  });
}

export default any;
