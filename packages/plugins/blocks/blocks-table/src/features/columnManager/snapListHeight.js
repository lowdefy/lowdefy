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

// Caps a scrolling list at the last whole entry that fits its CSS max-height, so the entry above
// the popover footer is never cut in half, and marks it `data-scrollable` while it scrolls (the
// divider above the footer). Entries have different heights (items, boundaries, headings), so
// the cap is found from the rendered entries after each render.
function snapListHeight(list) {
  list.style.maxHeight = '';
  const limit = Number.parseFloat(getComputedStyle(list).maxHeight);
  if (!Number.isFinite(limit) || list.scrollHeight <= limit) {
    delete list.dataset.scrollable;
    return;
  }
  list.dataset.scrollable = '';
  const style = getComputedStyle(list);
  // With border-box sizing the max-height includes the divider.
  const border =
    style.boxSizing === 'border-box'
      ? Number.parseFloat(style.borderTopWidth) + Number.parseFloat(style.borderBottomWidth)
      : 0;
  let height = 0;
  for (const entry of list.children) {
    const bottom = entry.offsetTop + entry.offsetHeight;
    if (bottom + border > limit) break;
    height = bottom;
  }
  list.style.maxHeight = `${height + border}px`;
}

export default snapListHeight;
