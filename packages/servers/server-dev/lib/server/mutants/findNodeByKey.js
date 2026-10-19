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

// The node of a deserialised build artifact whose ~k is `key`, with the
// container that holds it. serializer.deserialize restores ~k as a
// non-enumerable property, so it is read directly; Object.keys skips it.
function findNodeByKey({ root, key }) {
  const stack = [{ node: root, parent: null, keyInParent: null }];
  while (stack.length > 0) {
    const entry = stack.pop();
    const { node } = entry;
    if (!type.isObject(node) && !type.isArray(node)) {
      continue;
    }
    if (node['~k'] === key) {
      return entry;
    }
    const children = type.isArray(node)
      ? node.map((child, index) => ({ node: child, parent: node, keyInParent: index }))
      : Object.keys(node).map((childKey) => ({
          node: node[childKey],
          parent: node,
          keyInParent: childKey,
        }));
    stack.push(...children.reverse());
  }
  return null;
}

export default findNodeByKey;
