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

import { getOperatorType, type } from '@lowdefy/helpers';

// The type names a page config uses that the loaded registries cannot resolve.
// A page module carries the types the build saw; a Dynamic block resolved at
// page-get time, or a page the dev server built just in time, can carry more.
//
// A `type` string is checked against the block and action registries together:
// blocks and actions share the key, and the answer only decides whether the
// full barrels are needed, so resolving either way is enough.
function findMissingTypes({ pageConfig, types }) {
  const missing = new Set();

  function walk(node) {
    if (type.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (!type.isObject(node)) {
      return;
    }
    const operator = getOperatorType(node);
    if (!type.isNone(operator) && type.isNone(types.operators[operator])) {
      missing.add(operator);
    }
    if (
      type.isString(node.type) &&
      type.isNone(types.blocks[node.type]) &&
      type.isNone(types.actions[node.type])
    ) {
      missing.add(node.type);
    }
    Object.keys(node).forEach((key) => walk(node[key]));
  }

  walk(pageConfig);
  return [...missing];
}

export default findMissingTypes;
