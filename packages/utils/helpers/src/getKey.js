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

import type from './type.js';
import { isReserved, ReservedKeyError } from './ReservedKeyError.js';

// Reads a single literal key off a plain object. Dots are not path separators.
function getKey(target, key, defaultValue) {
  if (!type.isObject(target)) {
    throw new TypeError('getKey: target must be a plain object');
  }
  if (!type.isString(key)) {
    throw new TypeError('getKey: key must be a string');
  }
  // Rejected even on null-proto targets, where the read would be safe: a caller seeing
  // ReservedKeyError always knows the key was rejected, regardless of target shape.
  if (isReserved(key)) {
    throw new ReservedKeyError(key);
  }
  // Own-property read so inherited Object.prototype members never leak as values.
  if (Object.hasOwn(target, key)) {
    return target[key];
  }
  return defaultValue;
}

export default getKey;
