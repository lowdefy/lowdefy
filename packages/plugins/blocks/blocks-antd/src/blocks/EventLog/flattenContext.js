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

// A nested context object becomes a flat list of dot-path rows, so the expanded row reads like a
// console context table. Arrays of scalars stay on one line, arrays of objects get indexed paths.
function flattenContext(value, path = '', rows = []) {
  if (type.isNone(value)) {
    rows.push({ key: path, value: 'null', mono: true });
    return rows;
  }
  if (type.isArray(value)) {
    if (value.length === 0) {
      rows.push({ key: path, value: '[]', mono: true });
      return rows;
    }
    if (value.every((item) => !type.isObject(item) && !type.isArray(item))) {
      rows.push({ key: path, value: value.join(', '), mono: true });
      return rows;
    }
    value.forEach((item, index) => flattenContext(item, `${path}[${index}]`, rows));
    return rows;
  }
  if (type.isObject(value)) {
    const keys = Object.keys(value);
    if (keys.length === 0) {
      rows.push({ key: path, value: '{}', mono: true });
      return rows;
    }
    keys.forEach((key) => flattenContext(value[key], path === '' ? key : `${path}.${key}`, rows));
    return rows;
  }
  rows.push({
    key: path,
    value: String(value),
    mono: !type.isString(value) || value.length < 80,
  });
  return rows;
}

export default flattenContext;
