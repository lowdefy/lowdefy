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

import configPathSegments from './configPathSegments.js';

// The array items, across a build's keyMap, whose id and type label is shared
// by a sibling at another index. Their position-free path keeps the index,
// since the label alone would name two nodes.
function collectSharedIds({ keyMap }) {
  const indices = new Map();
  Object.values(keyMap).forEach((entry) => {
    const segments = configPathSegments(entry.key ?? '');
    const last = segments[segments.length - 1];
    if (last === undefined || last.label === '' || last.end !== entry.key.length) {
      return;
    }
    const sibling = `${last.prefix}[${last.label}]`;
    if (!indices.has(sibling)) {
      indices.set(sibling, new Set());
    }
    indices.get(sibling).add(last.index);
  });
  return new Set(
    [...indices.entries()].filter(([, found]) => found.size > 1).map(([sibling]) => sibling)
  );
}

export default collectSharedIds;
