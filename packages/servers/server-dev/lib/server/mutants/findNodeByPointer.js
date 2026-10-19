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

import hashMutantTarget from './hashMutantTarget.js';

// The node a pointer (the keys and array indexes from the artifact root, as
// the mutant listing recorded them) leads to, with the container that holds
// it, or null. A page the dev server rebuilds is issued new ~k keys, so a
// mutant's key can miss while the page's config, and so its shape, is
// unchanged. The node is taken only when its content hash is the one listed, so
// a pointer into changed content finds nothing rather than another node.
function findNodeByPointer({ root, pointer, nodeHash }) {
  if (!type.isArray(pointer) || pointer.length === 0 || !type.isString(nodeHash)) {
    return null;
  }
  let parent = null;
  let node = root;
  for (const step of pointer) {
    if (!type.isObject(node) && !type.isArray(node)) {
      return null;
    }
    if (!Object.prototype.hasOwnProperty.call(node, step)) {
      return null;
    }
    parent = node;
    node = node[step];
  }
  if (!type.isObject(node) || hashMutantTarget(node) !== nodeHash) {
    return null;
  }
  return { node, parent, keyInParent: pointer[pointer.length - 1] };
}

export default findNodeByPointer;
