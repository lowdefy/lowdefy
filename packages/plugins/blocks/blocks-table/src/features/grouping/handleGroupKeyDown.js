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

// Keys on a focused group header cell, ahead of the keyboard feature: Enter toggles the group,
// Right expands and Left collapses it (on an already expanded or collapsed group the arrow moves
// between cells as usual), Space selects the group's rows.
function handleGroupKeyDown(event, api) {
  if (!api.config.keyboard) return false;
  const cell = event.target.closest('[data-lf-cell]');
  if (!cell || cell !== event.target || !api.contains(cell)) return false;
  const rowElement = cell.closest('[data-group-key]');
  if (!rowElement) return false;
  const key = rowElement.dataset.groupKey;
  const collapsed = api.state.collapsedGroups.includes(key);
  switch (event.key) {
    case 'Enter':
      event.preventDefault();
      api.actions.toggleGroup({ key });
      return true;
    case 'ArrowRight':
      if (!collapsed) return false;
      event.preventDefault();
      api.actions.toggleGroup({ key, collapsed: false });
      return true;
    case 'ArrowLeft':
      if (collapsed) return false;
      event.preventDefault();
      api.actions.toggleGroup({ key, collapsed: true });
      return true;
    case ' ':
      event.preventDefault();
      api.actions.toggleGroupSelected({ key });
      return true;
    default:
      return false;
  }
}

export default handleGroupKeyDown;
