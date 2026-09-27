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

function joinPath(path, key) {
  return path ? `${path}.${key}` : `${key}`;
}

// Returns { operator, path } for the first object in a data value the client
// could run as one of its operators, or null. The path is relative to the value,
// dot-separated ('' for the value itself). The value is the serialized form the
// page sends (an Error or Date is a "~e" or "~d" object there), and the scan
// walks into every such wrapper, whose contents the client evaluates before it
// revives the wrapper. operators is the app's set of client operator names.
// Walks depth first, in key order, with an explicit stack.
function findOperatorInData({ value, operators = null }) {
  const pending = [{ node: value, path: '' }];
  while (pending.length > 0) {
    const { node, path } = pending.pop();
    let children = [];
    if (type.isArray(node)) {
      children = node.map((item, index) => ({ node: item, path: joinPath(path, index) }));
    } else if (type.isObject(node)) {
      const [possible] = getPossibleOperators({ value: node, operators });
      if (possible) {
        return { operator: possible.operator, path };
      }
      children = Object.keys(node).map((key) => ({ node: node[key], path: joinPath(path, key) }));
    }
    for (let index = children.length - 1; index >= 0; index -= 1) {
      pending.push(children[index]);
    }
  }
  return null;
}

export default findOperatorInData;
