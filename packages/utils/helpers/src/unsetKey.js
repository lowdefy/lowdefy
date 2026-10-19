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

// Deletes a single literal key off a plain object. Dots are not path separators.
function unsetKey(target, key) {
  if (!type.isObject(target)) {
    throw new TypeError('unsetKey: target must be a plain object');
  }
  if (!type.isString(key)) {
    throw new TypeError('unsetKey: key must be a string');
  }
  // Rejected even on null-proto targets, where the delete would be safe: a caller seeing
  // ReservedKeyError always knows the key was rejected, regardless of target shape.
  if (isReserved(key)) {
    throw new ReservedKeyError(key);
  }
  // Own-property check so deleting an absent key never touches the prototype chain.
  if (Object.hasOwn(target, key)) {
    delete target[key];
  }
  return target;
}

export default unsetKey;
