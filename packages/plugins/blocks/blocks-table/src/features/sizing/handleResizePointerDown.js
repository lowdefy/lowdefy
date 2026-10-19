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

// Resize by CSS variables (D10.6): while the pointer moves, the layout is recomputed with the
// dragged width and written to the root's --lf-* variables in a rAF, with zero React renders. The
// width commits to TanStack's columnSizing (and so to the block value) once, on pointerup.
function handleResizePointerDown(event, api) {
  const handle = event.target.closest('[data-lf-resize]');
  if (!handle || !api.contains(handle) || event.button !== 0) return false;
  event.preventDefault();
  event.stopPropagation();
  const { colKey: key } = handle.dataset;
  const col = api.layout.byKey.get(key);
  const root = api.rootRef.current;
  const startX = event.clientX;
  const startWidth = col.width;
  const minWidth = col.minWidth;
  const maxWidth = col.maxWidth;
  let width = startWidth;
  let frame = 0;

  root.setAttribute('data-resizing', '');
  handle.setAttribute('data-active', '');
  handle.setPointerCapture?.(event.pointerId);

  function onMove(moveEvent) {
    width = Math.round(
      Math.min(maxWidth, Math.max(minWidth, startWidth + moveEvent.clientX - startX))
    );
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      api.previewLayout({ widths: { [key]: width } });
    });
  }

  function onEnd() {
    if (frame) cancelAnimationFrame(frame);
    handle.removeEventListener('pointermove', onMove);
    handle.removeEventListener('pointerup', onEnd);
    handle.removeEventListener('pointercancel', onEnd);
    root.removeAttribute('data-resizing');
    handle.removeAttribute('data-active');
    api.suppressClick();
    if (width === startWidth) return;
    api.updateSlice('columnSizing', (previous) => ({ ...previous, [key]: width }));
  }

  handle.addEventListener('pointermove', onMove);
  handle.addEventListener('pointerup', onEnd);
  handle.addEventListener('pointercancel', onEnd);
  return true;
}

export default handleResizePointerDown;
