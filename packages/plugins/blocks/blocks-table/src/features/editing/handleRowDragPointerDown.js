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

const EDGE = 24;
const SCROLL_STEP = 16;

function getGap({ api, clientY }) {
  const scroller = api.scrollerRef.current;
  const rect = scroller.getBoundingClientRect();
  const y = clientY - rect.top + scroller.scrollTop - api.headerHeight;
  return Math.min(Math.max(Math.round(y / api.rowHeight), 0), api.rows.length);
}

function autoScroll({ api, clientY }) {
  const scroller = api.scrollerRef.current;
  const rect = scroller.getBoundingClientRect();
  if (clientY < rect.top + api.headerHeight + EDGE) scroller.scrollTop -= SCROLL_STEP;
  if (clientY > rect.bottom - EDGE) scroller.scrollTop += SCROLL_STEP;
}

// Row drag reorder (`rowDrag`). The drag itself never renders React: a drop indicator line is
// moved in the canvas and the dragged row is marked with an attribute, the way column resize
// previews its widths. The move happens once, on drop. Esc cancels.
function handleRowDragPointerDown(event, api) {
  const handle = event.target.closest('[data-lf-drag-handle]');
  if (!handle || !api.contains(handle)) return false;
  event.preventDefault();
  if (event.button !== 0 || api.editing.reorderBlock.get()) return true;
  const rowElement = handle.closest('[data-row-key]');
  const canvas = api.scrollerRef.current?.querySelector('.lf-table-canvas');
  if (!rowElement || !canvas) return true;
  const rowId = rowElement.dataset.rowKey;
  api.actions.cancelEdit({ refocus: false });

  const indicator = document.createElement('div');
  indicator.className = 'lf-table-drop-indicator';
  canvas.appendChild(indicator);
  rowElement.setAttribute('data-lf-dragging', '');
  let gap = null;

  function place(clientY) {
    gap = getGap({ api, clientY });
    indicator.style.transform = `translateY(${api.headerHeight + gap * api.rowHeight - 1}px)`;
  }

  function end() {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onCancel);
    window.removeEventListener('keydown', onKeyDown, true);
    indicator.remove();
    rowElement.removeAttribute('data-lf-dragging');
  }

  function onMove(moveEvent) {
    autoScroll({ api, clientY: moveEvent.clientY });
    place(moveEvent.clientY);
  }

  function onUp(upEvent) {
    place(upEvent.clientY);
    end();
    api.actions.moveRow({ rowId, gap });
  }

  function onCancel() {
    end();
  }

  function onKeyDown(keyEvent) {
    if (keyEvent.key !== 'Escape') return;
    keyEvent.preventDefault();
    keyEvent.stopPropagation();
    end();
  }

  place(event.clientY);
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onCancel);
  window.addEventListener('keydown', onKeyDown, true);
  return true;
}

export default handleRowDragPointerDown;
