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

// Returns focus to a column's header after one of its overlays closes from the keyboard: the menu
// button when there is one, else the header cell. It waits a frame, because the key that closed
// the overlay is still being handled (Enter on a menu item would also press the button), and it
// leaves focus alone when the next overlay (a filter popover) has already taken it.
function focusHeaderControl({ api, key }) {
  requestAnimationFrame(() => {
    const active = document.activeElement;
    if (active && active !== document.body && document.contains(active)) return;
    const cell = api.rootRef.current?.querySelector(
      `[data-lf-header][data-col-key="${CSS.escape(key)}"]`
    );
    if (!cell) return;
    const trigger = cell.querySelector('[data-lf-header-menu]');
    (trigger ?? cell).focus({ preventScroll: true });
  });
}

export default focusHeaderControl;
