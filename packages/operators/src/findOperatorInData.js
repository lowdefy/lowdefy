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

import getPossibleOperators from './getPossibleOperators.js';

function findInValue({ value, path, operators }) {
  if (type.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const found = findInValue({
        value: value[index],
        path: path ? `${path}.${index}` : `${index}`,
        operators,
      });
      if (found) return found;
    }
    return null;
  }
  if (!type.isObject(value)) {
    return null;
  }
  const [possible] = getPossibleOperators({ value, operators });
  if (possible) {
    return { operator: possible.operator, path };
  }
  for (const key of Object.keys(value)) {
    const found = findInValue({
      value: value[key],
      path: path ? `${path}.${key}` : key,
      operators,
    });
    if (found) return found;
  }
  return null;
}

// Returns { operator, path } for the first object in a data value the client
// could run as one of its operators, or null. The path is relative to the value,
// dot-separated ('' for the value itself). The value is the serialized form the
// page sends (an Error or Date is a "~e" or "~d" object there), and the scan
// walks into every such wrapper, whose contents the client evaluates before it
// revives the wrapper. operators is the app's set of client operator names.
function findOperatorInData({ value, operators = null }) {
  return findInValue({ value, path: '', operators });
}

export default findOperatorInData;
