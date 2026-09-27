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

import { getOperatorType, type } from '@lowdefy/helpers';

// Returns { operator, path } for the first operator-shaped object in a data value,
// or null. The path is relative to the value, dot-separated ('' for the value itself).
function findOperatorInData(value, path = '') {
  if (type.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const found = findOperatorInData(value[index], path ? `${path}.${index}` : `${index}`);
      if (found) return found;
    }
    return null;
  }
  if (!type.isObject(value)) {
    return null;
  }
  // Keys the client may never see: JSON drops an undefined value, and a
  // "__proto__" key parsed from JSON becomes a prototype, not a key, once the
  // object is copied by assignment. Without them { _request: 'x', note: undefined }
  // reaches the client as an operator.
  const sent = Object.fromEntries(
    Object.entries(value).filter(([key, item]) => key !== '__proto__' && !type.isUndefined(item))
  );
  const operator = getOperatorType(sent);
  if (operator) {
    return { operator, path };
  }
  for (const key of Object.keys(value)) {
    const found = findOperatorInData(value[key], path ? `${path}.${key}` : key);
    if (found) return found;
  }
  return null;
}

export default findOperatorInData;
