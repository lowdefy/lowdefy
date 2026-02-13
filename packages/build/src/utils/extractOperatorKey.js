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

/**
 * Extracts the top-level key from an operator reference value.
 *
 * Handles both string and object forms of operator references:
 * - String: "_state: 'user.name'" -> 'user'
 * - Object: "_state: { key: 'user.name' }" -> 'user'
 * - Object: "_state: { path: 'user[0].name' }" -> 'user'
 *
 * @param {Object} params
 * @param {string|Object} params.operatorValue - The value of the operator (e.g., obj._state)
 * @returns {string|null} The top-level key, or null if not extractable
 */
function extractOperatorKey({ operatorValue }) {
  const value = type.isString(operatorValue)
    ? operatorValue
    : type.isObject(operatorValue)
      ? operatorValue.key || operatorValue.path
      : null;

  if (!value) {
    return null;
  }

  // Extract first segment before any '.' or '['
  const topLevelKey = value.split(/[.[]/)[0];
  return topLevelKey || null;
}

export default extractOperatorKey;
