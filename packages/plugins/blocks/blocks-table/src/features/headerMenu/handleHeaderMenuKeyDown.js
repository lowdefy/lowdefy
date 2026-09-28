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

// Alt+ArrowDown, Shift+F10 or the context menu key on a focused header cell opens its menu (the
// ARIA menu-button convention), without tabbing to the button first.
function handleHeaderMenuKeyDown(event, api) {
  if (!api.config.headerMenu) return false;
  const cell = event.target.closest('[data-lf-header]');
  if (!cell || event.target !== cell || !api.contains(cell) || cell.dataset.special) return false;
  const opens =
    (event.altKey && event.key === 'ArrowDown') ||
    (event.shiftKey && event.key === 'F10') ||
    event.key === 'ContextMenu';
  if (!opens) return false;
  event.preventDefault();
  return api.actions.openHeaderMenu({ key: cell.dataset.colKey });
}

export default handleHeaderMenuKeyDown;
