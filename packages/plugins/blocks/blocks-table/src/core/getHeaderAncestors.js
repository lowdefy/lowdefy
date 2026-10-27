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
  nodes.forEach((node) => {
    if (node.group === true) {
      walk({ nodes: node.children, ancestors: [...ancestors, node], ancestorsByKey });
      return;
    }
    ancestorsByKey.set(node.key, ancestors);
  });
}

// Each leaf column key mapped to its header group nodes, outermost first, from normalizeColumns'
// header tree. getHeaderLevels reads it with the displayed columns to decide the group rows.
function getHeaderAncestors({ headerGroups }) {
  const ancestorsByKey = new Map();
  walk({ nodes: headerGroups, ancestors: [], ancestorsByKey });
  return ancestorsByKey;
}

export default getHeaderAncestors;
