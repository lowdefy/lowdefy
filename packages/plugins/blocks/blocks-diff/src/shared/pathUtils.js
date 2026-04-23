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

import pluralize from 'pluralize';
import { type } from '@lowdefy/helpers';

export function isIndex(segment) {
  return type.isInt(segment) || (type.isString(segment) && /^\d+$/.test(segment));
}

function joinInternal(path) {
  return path.map((segment) => String(segment)).join('.');
}

function joinDisplay(path) {
  return path.reduce((acc, segment, index) => {
    if (isIndex(segment)) return `${acc}[${segment}]`;
    return index === 0 ? String(segment) : `${acc}.${segment}`;
  }, '');
}

export function pathToString(path, { display = false } = {}) {
  if (!type.isArray(path)) return '';
  return display ? joinDisplay(path) : joinInternal(path);
}

export function matchesPath(pathStr, patterns) {
  if (!type.isArray(patterns) || patterns.length === 0) return false;
  return patterns.some((pattern) => {
    if (!type.isString(pattern) || pattern === '') return false;
    if (pattern === pathStr) return true;
    if (pattern.endsWith('.*')) {
      const prefix = pattern.slice(0, -2);
      return pathStr === prefix || pathStr.startsWith(`${prefix}.`);
    }
    if (pattern.startsWith('*.')) {
      const suffix = pattern.slice(2);
      return pathStr === suffix || pathStr.endsWith(`.${suffix}`);
    }
    return false;
  });
}

export function humaniseSegment(segment) {
  const str = String(segment);
  const spaced = str
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim();
  if (spaced.length === 0) return str;
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function pathLabel(path, labelsMap) {
  if (!type.isArray(path) || path.length === 0) return '';
  const pathStr = pathToString(path);
  if (type.isObject(labelsMap) && type.isString(labelsMap[pathStr])) {
    return labelsMap[pathStr];
  }
  const leaf = path[path.length - 1];
  if (isIndex(leaf)) {
    if (path.length > 1) {
      const parent = pathToString(path.slice(0, -1));
      const parentLabel =
        type.isObject(labelsMap) && type.isString(labelsMap[parent])
          ? labelsMap[parent]
          : humaniseSegment(path[path.length - 2]);
      return `${parentLabel} [${leaf}]`;
    }
    return `[${leaf}]`;
  }
  return humaniseSegment(leaf);
}

export function resolveFormatter(pathStr, formatMap) {
  if (!type.isObject(formatMap)) return undefined;
  if (type.isObject(formatMap[pathStr])) return formatMap[pathStr];
  const keys = Object.keys(formatMap);
  for (const key of keys) {
    if (key.endsWith('.*')) {
      const prefix = key.slice(0, -2);
      if (pathStr === prefix || pathStr.startsWith(`${prefix}.`)) return formatMap[key];
    } else if (key.startsWith('*.')) {
      const suffix = key.slice(2);
      if (pathStr === suffix || pathStr.endsWith(`.${suffix}`)) return formatMap[key];
    }
  }
  return undefined;
}

export function getValueAtPath(obj, path) {
  let current = obj;
  for (const segment of path) {
    if (type.isNone(current)) return undefined;
    current = current[segment];
  }
  return current;
}

export function singularise(label) {
  if (!type.isString(label) || label.length === 0) return label;
  return pluralize.singular(label);
}

export { default as breadcrumbLabel } from './breadcrumbLabel.js';
