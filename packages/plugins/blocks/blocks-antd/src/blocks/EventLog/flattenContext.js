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

// A scalar or array at the top level has no path of its own, so it is listed under this key.
const TOP_LEVEL_KEY = 'value';

function formatScalar(value) {
  if (type.isNone(value)) return 'null';
  if (type.isDate(value)) return value.toISOString();
  return String(value);
}

function isScalar(value) {
  return !type.isObject(value) && !type.isArray(value);
}

// A nested context object becomes a flat list of dot-path rows, so the expanded row reads like a
// console context table. Arrays of scalars stay on one line, arrays of objects get indexed paths.
function flattenContext(value, path = '', rows = []) {
  const key = path === '' ? TOP_LEVEL_KEY : path;
  if (type.isArray(value)) {
    if (value.length === 0) {
      rows.push({ key, value: '[]', mono: true });
      return rows;
    }
    if (value.every(isScalar)) {
      rows.push({ key, value: value.map(formatScalar).join(', '), mono: true });
      return rows;
    }
    value.forEach((item, index) => flattenContext(item, `${path}[${index}]`, rows));
    return rows;
  }
  if (type.isObject(value)) {
    const keys = Object.keys(value);
    if (keys.length === 0) {
      rows.push({ key, value: '{}', mono: true });
      return rows;
    }
    keys.forEach((child) =>
      flattenContext(value[child], path === '' ? child : `${path}.${child}`, rows)
    );
    return rows;
  }
  const text = formatScalar(value);
  rows.push({
    key,
    value: text,
    mono: !type.isString(value) || value.length < 80,
  });
  return rows;
}

export default flattenContext;
