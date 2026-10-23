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

// Focuses the value input of the condition openFilter added on `key`, else its operator: the last
// one, once the builder shows more than the `existing` conditions the filter had on that column.
// Returns false while the builder has not rendered it.
function focusFilterLeaf({ container, key, existing }) {
  if (!container) return false;
  const leaves = [...container.querySelectorAll('[data-lf-filter-leaf]')].filter(
    (leaf) => leaf.getAttribute('data-col-key') === key
  );
  if (leaves.length <= existing) return false;
  const leaf = leaves[leaves.length - 1];
  const target =
    leaf.querySelector('.lf-filter-value input') ??
    leaf.querySelector('input.lf-filter-value') ??
    leaf.querySelector('.lf-filter-operator input') ??
    leaf.querySelector('input');
  if (!target) return false;
  target.focus();
  return true;
}

export default focusFilterLeaf;
