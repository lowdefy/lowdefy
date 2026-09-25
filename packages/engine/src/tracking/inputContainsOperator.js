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

// Block config is never mutated after build, so the answer is cached per config object.
const cache = new WeakMap();

// True when the input could contain an operator call: a single-key object whose key starts with
// '_', at any depth. Unregistered names count too, so this over-reports, which is the safe
// direction: it can only mark more blocks as needing a recording they did not get.
function inputContainsOperator(input) {
  const isArray = type.isArray(input);
  if (!isArray && !type.isObject(input)) {
    return false;
  }
  if (cache.has(input)) {
    return cache.get(input);
  }
  let result;
  if (isArray) {
    result = input.some(inputContainsOperator);
  } else {
    const keys = Object.keys(input);
    result =
      (keys.length === 1 && keys[0].startsWith('_')) ||
      keys.some((key) => inputContainsOperator(input[key]));
  }
  cache.set(input, result);
  return result;
}

export default inputContainsOperator;
