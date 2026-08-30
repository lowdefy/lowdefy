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

// Literal-config walk for the tenant field as an object key at any depth.
// Request properties are operator-evaluated at runtime, so a subtree under an
// operator node is unknowable here: the walk does not descend into it and
// reports `unknown: true` instead, letting a rule skip rather than guess.
// `found` is certain when true - a literal key is a literal key whatever the
// operators around it produce - and `values` holds every value authored at
// that key so a rule can inspect where the value comes from.
function walk(value, field, result) {
  if (type.isArray(value)) {
    value.forEach((item) => walk(item, field, result));
    return;
  }
  if (!type.isObject(value)) {
    return;
  }
  if (getOperatorType(value) !== null) {
    result.unknown = true;
    return;
  }
  Object.keys(value).forEach((key) => {
    if (key === field) {
      result.found = true;
      result.values.push(value[key]);
    }
    walk(value[key], field, result);
  });
}

function findTenantField({ value, field }) {
  const result = { found: false, unknown: false, values: [] };
  walk(value, field, result);
  return result;
}

export default findTenantField;
