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

import React, { useRef, useState } from 'react';
import { Tooltip } from 'antd';

import capturePointer from './capturePointer.js';
import clampPanelWidth from './clampPanelWidth.js';
import getDragWidth from './getDragWidth.js';
import releasePointer from './releasePointer.js';

const KEY_STEP = 16;
const KEY_STEP_LARGE = 64;
// Movement under this many pixels is a click, not a drag.
const CLICK_SLOP = 3;
export const PANEL_WIDTH_VAR = '--lf-rail-panel-current';

// The panel's right edge on a desktop. A drag moves the edge live, writing the width straight to
// the layout's CSS variable so the page does not re-render on every pointer move, and stores it
// on release. Short of the smallest width the edge resists; far enough past it, letting go
// collapses the panel. With the panel collapsed the edge stays at the rail: a click opens the
// panel and a drag pulls it out. A double-click puts the width back to where it started.
function PanelResizeHandle({
  blockId,
  className,
  limits,
  onCollapse,
  onCommit,
  open,
  rootRef,
  style,
  width,
}) {
  const drag = useRef(null);
  const [dragging, setDragging] = useState(false);
  // The hint stays away from a drag until the pointer leaves the edge, so it never pops up
  // under the pointer the moment a drag ends.
  const [quiet, setQuiet] = useState(false);

  function setLiveWidth(px) {
    rootRef.current?.style.setProperty(PANEL_WIDTH_VAR, `${px}px`);
  }

  function release(event) {
    releasePointer(event.currentTarget, event.pointerId);
    document.body.style.removeProperty('user-select');
    document.body.style.removeProperty('cursor');
    rootRef.current?.removeAttribute('data-resizing');
    window.removeEventListener('keydown', drag.current?.onEscape);
    drag.current = null;
    setDragging(false);
  }

  function finish(event) {
    const current = drag.current;
    if (!current) return;
    release(event);
    if (current.cancelled) return;
    if (current.distance < CLICK_SLOP) {
      // A click: on a collapsed panel it opens the panel; on an open one it does nothing.
      if (!open) onCommit(width, { expand: true, source: 'edge' });
      setLiveWidth(open ? width : 0);
      return;
    }
    if (current.collapse) {
      setLiveWidth(0);
      onCollapse('drag');
      return;
    }
    setLiveWidth(current.width);
    onCommit(current.width, { expand: !open, source: 'drag' });
  }

  return (
    <Tooltip
      title={open ? 'Drag to resize · Double-click to reset' : 'Click or drag to show the panel'}
      placement="right"
      mouseEnterDelay={0.8}
      open={dragging || quiet ? false : undefined}
    >
      <div
        id={`${blockId}_panel_handle`}
        className={className}
        style={style}
        role="separator"
        aria-orientation="vertical"
        aria-controls={`${blockId}_panel`}
        aria-label="Resize panel"
        aria-valuemin={0}
        aria-valuemax={limits.maxWidth}
        aria-valuenow={open ? width : 0}
        aria-valuetext={open ? `${width} pixels` : 'Collapsed'}
        tabIndex={0}
        data-dragging={dragging ? 'true' : undefined}
        onPointerLeave={() => !dragging && setQuiet(false)}
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          setQuiet(true);
          event.preventDefault();
          capturePointer(event.currentTarget, event.pointerId);
          const start = open ? width : 0;
          const onEscape = (keyEvent) => {
            if (keyEvent.key !== 'Escape' || !drag.current) return;
            drag.current.cancelled = true;
            setLiveWidth(start);
          };
          drag.current = {
            x: event.clientX,
            start,
            width: start,
            distance: 0,
            collapse: false,
            onEscape,
          };
          window.addEventListener('keydown', onEscape);
          document.body.style.userSelect = 'none';
          document.body.style.cursor = 'col-resize';
          rootRef.current?.setAttribute('data-resizing', 'true');
          setDragging(true);
        }}
        onPointerMove={(event) => {
          const current = drag.current;
          if (!current || current.cancelled) return;
          const dx = event.clientX - current.x;
          current.distance = Math.max(current.distance, Math.abs(dx));
          if (current.distance < CLICK_SLOP) return;
          const next = getDragWidth({ raw: current.start + dx, ...limits });
          current.width = next.width;
          current.collapse = next.collapse;
          rootRef.current?.setAttribute('data-resizing', next.collapse ? 'collapse' : 'true');
          setLiveWidth(next.width);
        }}
        onPointerUp={finish}
        onPointerCancel={(event) => {
          if (!drag.current) return;
          setLiveWidth(open ? width : 0);
          release(event);
        }}
        onDoubleClick={() => {
          setLiveWidth(limits.initialWidth);
          onCommit(limits.initialWidth, { expand: true, source: 'edge' });
        }}
        onKeyDown={(event) => {
          const large = event.shiftKey ? KEY_STEP_LARGE : KEY_STEP;
          let next = null;
          if (event.key === 'ArrowLeft' && open) next = width - large;
          if (event.key === 'ArrowRight') next = open ? width + large : limits.minWidth;
          if (event.key === 'Home') next = limits.minWidth;
          if (event.key === 'End') next = limits.maxWidth;
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            if (open) onCollapse('keyboard');
            else onCommit(width, { expand: true, source: 'keyboard' });
            return;
          }
          if (next === null) return;
          event.preventDefault();
          if (next < limits.minWidth) {
            // A step from the smallest width collapses the panel, as a drag past it does.
            if (width <= limits.minWidth) onCollapse('keyboard');
            else onCommit(limits.minWidth);
            return;
          }
          onCommit(clampPanelWidth({ width: next, ...limits }), {
            expand: !open,
            source: 'keyboard',
          });
        }}
      />
    </Tooltip>
  );
}

export default PanelResizeHandle;
