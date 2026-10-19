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

function walk({ nodes, ancestors, ancestorsByKey }) {
  let depth = ancestors.length;
  nodes.forEach((node) => {
    if (node.group === true) {
      const childDepth = walk({
        nodes: node.children,
        ancestors: [...ancestors, node],
        ancestorsByKey,
      });
      depth = Math.max(depth, childDepth);
      return;
    }
    ancestorsByKey.set(node.key, ancestors);
  });
  return depth;
}

// The header group rows above the leaf headers, from normalizeColumns' header tree: `depth` is
// the number of group rows, and `ancestorsByKey` maps each leaf column key to its group nodes,
// outermost first. Groups render from the current column layout, so a group whose columns were
// reordered apart renders as one cell per run of adjacent columns.
function getHeaderLevels({ headerGroups }) {
  const ancestorsByKey = new Map();
  const depth = walk({ nodes: headerGroups, ancestors: [], ancestorsByKey });
  return { depth, ancestorsByKey };
}

export default getHeaderLevels;
