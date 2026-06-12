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

// Walker-compatible provenance markers (S1 markers mode): non-enumerable,
// configurable ~r/~l that addKeys consumes into keyMap entries and deletes.
function setHidden(node, prop, value) {
  Object.defineProperty(node, prop, {
    value,
    enumerable: false,
    writable: true,
    configurable: true,
  });
}

// Construction-time marks carry the line (addLineNumbers parity) and, in
// S2a, the lexical key id (`<fileId>:<n>`, deterministic per source
// position) that addKeys consumes as the ~k id. ~r is never set at
// construction: the walker's timeline is ~l at parse, then ~r via
// tagRefDeep at ref completion / build-operator evaluation and via
// cloneVarValue at _var substitution — evaluateOperators' marker transfer
// (result['~r'] === undefined) depends on nodes being ~r-less until then.
function mark(node, line, lexId) {
  if (type.isObject(node) || type.isArray(node)) {
    setHidden(node, '~l', line);
    if (lexId !== undefined) {
      setHidden(node, '~lk', lexId);
    }
  }
  return node;
}

// tagRefDeep parity: sets ~r recursively, preserving existing markers — a
// subtree that already carries ~r is left whole.
function markDeep(node, refId) {
  if (!type.isObject(node) && !type.isArray(node)) return node;
  if (node['~r'] !== undefined) return node;
  setHidden(node, '~r', refId);
  if (type.isArray(node)) {
    node.forEach((item) => markDeep(item, refId));
    return node;
  }
  Object.keys(node).forEach((key) => markDeep(node[key], refId));
  return node;
}

export { mark, markDeep, setHidden };
