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

import YAML from 'yaml';
import { type } from '@lowdefy/helpers';

import { matchesPath } from './pathUtils.js';

function joinPath(basePath, segment) {
  return basePath.length === 0 ? String(segment) : `${basePath}.${segment}`;
}

export function filter(value, { hide, show } = {}, basePath = '') {
  const hasHide = type.isArray(hide) && hide.length > 0;
  const hasShow = type.isArray(show) && show.length > 0;
  if (!hasHide && !hasShow) return value;

  if (type.isArray(value)) {
    const result = [];
    value.forEach((item, index) => {
      const childPath = joinPath(basePath, index);
      if (type.isArray(item) || type.isObject(item)) {
        result.push(filter(item, { hide, show }, childPath));
        return;
      }
      if (hasHide && matchesPath(childPath, hide)) return;
      if (hasShow && !matchesPath(childPath, show)) return;
      result.push(item);
    });
    return result;
  }

  if (type.isObject(value)) {
    const result = {};
    Object.keys(value).forEach((key) => {
      const childValue = value[key];
      const childPath = joinPath(basePath, key);
      if (type.isArray(childValue) || type.isObject(childValue)) {
        result[key] = filter(childValue, { hide, show }, childPath);
        return;
      }
      if (hasHide && matchesPath(childPath, hide)) return;
      if (hasShow && !matchesPath(childPath, show)) return;
      result[key] = childValue;
    });
    return result;
  }

  return value;
}

function serializeYaml(obj, { hide, show } = {}) {
  if (type.isNone(obj)) return '';
  if (!type.isArray(obj) && !type.isObject(obj)) return '';
  const filtered = filter(obj, { hide, show });
  return YAML.stringify(filtered, { sortMapEntries: true, lineWidth: 0 });
}

export default serializeYaml;
