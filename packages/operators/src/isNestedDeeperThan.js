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

// True when objects and arrays in value nest deeper than limit levels. Walks
// with an explicit stack and stops at the limit, so the walk itself never runs
// out of stack, however deep or cyclic the value is.
function isNestedDeeperThan({ value, limit }) {
  const pending = [{ node: value, depth: 0 }];
  while (pending.length > 0) {
    const { node, depth } = pending.pop();
    if (type.isArray(node) || type.isObject(node)) {
      if (depth >= limit) {
        return true;
      }
      const children = type.isArray(node) ? node : Object.values(node);
      children.forEach((child) => pending.push({ node: child, depth: depth + 1 }));
    }
  }
  return false;
}

export default isNestedDeeperThan;
