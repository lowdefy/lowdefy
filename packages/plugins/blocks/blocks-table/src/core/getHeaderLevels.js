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

// The header group rows above the leaf headers: `depth` is the number of group rows, and
// `ancestorsByKey` (getHeaderAncestors) maps each leaf column key to its group nodes, outermost
// first. The depth follows the displayed columns (`cols`, the layout's), not the config, so a
// nested group that a collapsed group or the view hides leaves no empty row behind. Groups
// render from the current column layout, so a group whose columns were reordered apart renders
// as one cell per run of adjacent columns.
function getHeaderLevels({ ancestorsByKey, cols }) {
  let depth = 0;
  cols.forEach((col) => {
    if (col.special) return;
    depth = Math.max(depth, ancestorsByKey.get(col.key)?.length ?? 0);
  });
  return { depth, ancestorsByKey };
}

export default getHeaderLevels;
