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

// A click on a collapsible column group's chevron (a button, so Enter and Space on it click too)
// collapses or expands the group. The collapsed keys stay in config order.
function handleColumnGroupToggle(event, api) {
  const button = event.target.closest('[data-lf-column-group-toggle]');
  if (!button || !api.contains(button)) return false;
  const key = button.dataset.lfColumnGroupToggle;
  api.updateSlice('collapsedColumnGroups', (collapsed) => {
    const next = new Set(collapsed);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    return api.config.columnGroups.groups
      .filter((group) => next.has(group.key))
      .map((group) => group.key);
  });
  return true;
}

export default handleColumnGroupToggle;
