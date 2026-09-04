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

import { isMap, isScalar, isSeq } from 'yaml';

// The whole rewrite works on yaml AST nodes rather than plain objects, because
// a plain-object round trip drops every comment in the file. These helpers are
// the only place that knows the node shapes.

function mapKeys(node) {
  if (!isMap(node)) return [];
  return node.items.map((item) => (isScalar(item.key) ? item.key.value : item.key));
}

// A Lowdefy runtime operator is a map with exactly one key that starts with "_".
function isOperatorNode(node) {
  if (!isMap(node)) return false;
  const keys = mapKeys(node);
  return keys.length === 1 && typeof keys[0] === 'string' && keys[0].startsWith('_');
}

// Reads a key as a plain JS value, or undefined when the value is not a scalar.
function scalarValue(node, key) {
  const value = isMap(node) ? node.get(key, true) : undefined;
  return isScalar(value) ? value.value : undefined;
}

function deleteKeys(node, keys) {
  keys.forEach((key) => node.delete(key));
}

export { deleteKeys, isMap, isOperatorNode, isScalar, isSeq, mapKeys, scalarValue };
