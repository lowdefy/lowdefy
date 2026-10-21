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

import React, { useRef } from 'react';

import { clampPanelWidth } from './clampPanelWidth.js';

const KEY_STEP = 16;

// The panel's right edge. Dragging sets the width live and stores it once on release; the arrow
// keys step it when the edge has focus.
function PanelResizeHandle({ className, style, limits, width, setWidth, commit }) {
  const drag = useRef(null);

  function finish(event) {
    if (!drag.current) return;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    document.body.style.removeProperty('user-select');
    document.body.style.removeProperty('cursor');
    const final = drag.current.width;
    drag.current = null;
    commit(final);
  }

  return (
    <div
      className={className}
      style={style}
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize panel"
      aria-valuemin={limits.minWidth}
      aria-valuemax={limits.maxWidth}
      aria-valuenow={width}
      tabIndex={0}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        event.preventDefault();
        event.currentTarget.setPointerCapture?.(event.pointerId);
        drag.current = { x: event.clientX, start: width, width };
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'col-resize';
      }}
      onPointerMove={(event) => {
        if (!drag.current) return;
        const next = clampPanelWidth({
          width: drag.current.start + event.clientX - drag.current.x,
          ...limits,
        });
        drag.current.width = next;
        setWidth(next);
      }}
      onPointerUp={finish}
      onPointerCancel={finish}
      onKeyDown={(event) => {
        let step = 0;
        if (event.key === 'ArrowLeft') step = -KEY_STEP;
        if (event.key === 'ArrowRight') step = KEY_STEP;
        if (step === 0) return;
        event.preventDefault();
        const next = clampPanelWidth({ width: width + step, ...limits });
        if (next !== width) commit(next);
      }}
    />
  );
}

export default PanelResizeHandle;
