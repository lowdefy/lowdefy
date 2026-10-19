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

import isPlainObject from './isPlainObject.js';

function walk(value, visited) {
  if (typeof value === 'function') return true;
  const isArray = Array.isArray(value);
  if (!isArray && !isPlainObject(value)) return false;
  if (visited.has(value)) return false;
  visited.add(value);
  if (isArray) {
    for (let index = 0; index < value.length; index += 1) {
      if (walk(value[index], visited)) return true;
    }
    return false;
  }
  for (const key in value) {
    if (walk(value[key], visited)) return true;
  }
  return false;
}

// Walks plain objects and arrays only: a function nested in config-shaped data (an AgGrid column
// definition's valueFormatter, say) is what matters, and class instances are not walked into. It
// scans the whole result of every call whose declaration asks, so it tests types natively and
// allocates nothing for a result that is not a container.
function containsFunction(value) {
  if (typeof value === 'function') return true;
  if (typeof value !== 'object' || value === null) return false;
  return walk(value, new Set());
}

export default containsFunction;
