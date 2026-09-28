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

import getColumnClientBounds from './getColumnClientBounds.js';
import moveKeys from './moveKeys.js';

const DRAG_THRESHOLD = 5;

function findInsertIndex({ candidates, clientX, layout, scroller }) {
  let index = 0;
  candidates.forEach((col, i) => {
    const bounds = getColumnClientBounds({ col, layout, scroller });
    if (clientX > (bounds.left + bounds.right) / 2) index = i + 1;
  });
  return index;
}

function lineClientX({ candidates, index, layout, scroller }) {
  if (index < candidates.length) {
    return getColumnClientBounds({ col: candidates[index], layout, scroller }).left;
  }
  return getColumnClientBounds({ col: candidates[candidates.length - 1], layout, scroller }).right;
}

// Reorder by header drag (D10.6): a ghost follows the pointer and an insertion line marks the drop
// position, both moved with transforms. Nothing renders until the drop commits the new order.
// Columns move within their region (start-pinned, centre or end-pinned).
function handleReorderPointerDown(event, api) {
  if (!api.config.reorderable || event.button !== 0) return false;
  const cell = event.target.closest('[data-lf-header]');
  if (!cell || !api.contains(cell) || event.target.closest('[data-lf-resize]')) return false;
  const col = api.layout.byKey.get(cell.dataset.colKey);
  if (!col || col.special) return false;
  const candidates = api.layout[col.region].filter((candidate) => !candidate.special);
  if (candidates.length < 2) return false;

  const root = api.rootRef.current;
  const scroller = api.scrollerRef.current;
  const startX = event.clientX;
  const startY = event.clientY;
  const cellRect = cell.getBoundingClientRect();
  const offsetX = startX - cellRect.left;
  let dragging = false;
  let ghost = null;
  let line = null;
  let insertIndex = candidates.indexOf(col);

  function begin() {
    dragging = true;
    root.setAttribute('data-reordering', '');
    ghost = document.createElement('div');
    ghost.className = 'lf-table-reorder-ghost';
    ghost.textContent = cell.textContent;
    ghost.style.width = `${cellRect.width}px`;
    ghost.style.height = `${cellRect.height}px`;
    root.appendChild(ghost);
    line = document.createElement('div');
    line.className = 'lf-table-reorder-line';
    scroller.firstChild.appendChild(line);
  }

  function onMove(moveEvent) {
    if (!dragging) {
      const distance = Math.abs(moveEvent.clientX - startX) + Math.abs(moveEvent.clientY - startY);
      if (distance < DRAG_THRESHOLD) return;
      begin();
    }
    ghost.style.transform = `translate(${moveEvent.clientX - offsetX}px, ${cellRect.top}px)`;
    insertIndex = findInsertIndex({
      candidates,
      clientX: moveEvent.clientX,
      layout: api.layout,
      scroller,
    });
    const scrollerRect = scroller.getBoundingClientRect();
    const x =
      lineClientX({ candidates, index: insertIndex, layout: api.layout, scroller }) -
      scrollerRect.left +
      scroller.scrollLeft;
    line.style.transform = `translate(${x - 1}px, ${scroller.scrollTop}px)`;
  }

  function cleanup() {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', cleanup);
    root.removeAttribute('data-reordering');
    ghost?.remove();
    line?.remove();
  }

  function onUp() {
    cleanup();
    if (!dragging) return;
    api.suppressClick();
    const fromIndex = candidates.indexOf(col);
    const keys = candidates.map((candidate) => candidate.key);
    keys.splice(fromIndex, 1);
    const targetIndex = insertIndex > fromIndex ? insertIndex - 1 : insertIndex;
    if (targetIndex === fromIndex) return;
    keys.splice(targetIndex, 0, col.key);
    api.updateSlice('columnOrder', (order) => moveKeys({ order, sequence: keys }));
    if (col.region !== 'center') {
      api.updateSlice('columnPinning', (pinning) => ({
        ...pinning,
        [col.region]: moveKeys({ order: pinning[col.region], sequence: keys }),
      }));
    }
  }

  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', cleanup);
  return false;
}

export default handleReorderPointerDown;
