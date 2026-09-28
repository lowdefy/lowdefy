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

function horizontalPadding(element) {
  const style = getComputedStyle(element);
  return parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
}

// The width a column needs to show its rendered cells and its header without truncation. Only
// rendered cells can be measured (the virtual window); that is what the user is looking at.
function measureColumnWidth({ api, key }) {
  const root = api.rootRef.current;
  const selector = `[data-lf-cell][data-col-key="${CSS.escape(key)}"]`;
  let width = 0;
  root.querySelectorAll(`.lf-table-body ${selector}`).forEach((cell) => {
    let content = 0;
    Array.from(cell.children).forEach((child) => {
      content = Math.max(content, child.scrollWidth);
    });
    width = Math.max(width, content + horizontalPadding(cell));
  });
  const header = root.querySelector(`[data-lf-header]${selector}`);
  if (header) {
    const style = getComputedStyle(header);
    const gap = parseFloat(style.columnGap) || 0;
    let content = 0;
    let parts = 0;
    Array.from(header.children).forEach((child) => {
      if (getComputedStyle(child).position === 'absolute') return;
      content += child.classList.contains('lf-table-header-title')
        ? child.scrollWidth
        : child.offsetWidth;
      parts += 1;
    });
    width = Math.max(width, content + gap * Math.max(parts - 1, 0) + horizontalPadding(header));
  }
  // One pixel of slack: scrollWidth rounds down fractional text widths.
  return Math.ceil(width) + 1;
}

export default measureColumnWidth;
