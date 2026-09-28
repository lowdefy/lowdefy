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

const KEYS = { Enter: undefined, ' ': undefined, ArrowRight: true, ArrowLeft: false };

// On a group header, Enter or Space toggles the group, Right expands and Left collapses it.
function handleGroupKeyDown(event, api) {
  if (!api.serverStore || !api.config.keyboard) return false;
  if (!Object.hasOwn(KEYS, event.key)) return false;
  const rowElement = event.target.closest('[data-lf-group-row]');
  if (!rowElement || !api.contains(rowElement)) return false;
  event.preventDefault();
  api.actions.toggleGroup({ key: rowElement.dataset.groupKey, expanded: KEYS[event.key] });
  return true;
}

export default handleGroupKeyDown;
