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

const MASKED = '***MASKED***';
const MAX_STRING_LENGTH = 10000;
const HEURISTIC_PATTERNS = [/password/i, /token/i, /secret/i, /authorization/i, /apikey/i];

function shouldMaskKey(key, exactKeys) {
  if (exactKeys.has(key)) return true;
  return HEURISTIC_PATTERNS.some((pattern) => pattern.test(key));
}

function truncateString(value) {
  if (typeof value !== 'string') return value;
  if (value.length <= MAX_STRING_LENGTH) return value;
  return `${value.slice(0, MAX_STRING_LENGTH)}...[truncated]`;
}

function maskNode(node, exactKeys, seen) {
  if (node === null || node === undefined) return node;
  if (typeof node === 'string') return truncateString(node);
  if (type.isArray(node)) {
    if (seen.has(node)) return '[Circular]';
    seen.add(node);
    return node.map((item) => maskNode(item, exactKeys, seen));
  }
  if (type.isObject(node)) {
    if (seen.has(node)) return '[Circular]';
    seen.add(node);
    const result = {};
    Object.keys(node).forEach((key) => {
      if (shouldMaskKey(key, exactKeys)) {
        result[key] = MASKED;
      } else {
        result[key] = maskNode(node[key], exactKeys, seen);
      }
    });
    return result;
  }
  return node;
}

function applyMask(value, maskList = []) {
  const exactKeys = new Set(maskList);
  return maskNode(value, exactKeys, new WeakSet());
}

export default applyMask;
