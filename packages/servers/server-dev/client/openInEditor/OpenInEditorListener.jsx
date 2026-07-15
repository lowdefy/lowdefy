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

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { blockAncestorChain, nearestBlock } from '../feedback/elementInspect.js';
import { highlightBox, labelChip, overlayContainer } from '../feedback/feedbackStyles.js';
import findBlockLocation from './findBlockLocation.js';

const STYLE_TAG_ID = 'lowdefy-open-in-editor-style-tag';
const BODY_CLASS = 'lowdefy-open-in-editor-target';

// Cursor over arbitrary app descendants can't be forced from inline styles —
// same trick as feedbackStyles' picking/drawing classes.
function injectStyleTag() {
  if (typeof document === 'undefined' || document.getElementById(STYLE_TAG_ID)) {
    return;
  }
  const style = document.createElement('style');
  style.id = STYLE_TAG_ID;
  style.textContent = `
    .${BODY_CLASS}, .${BODY_CLASS} * {
      cursor: pointer !important;
    }
  `;
  document.head.appendChild(style);
}

function removeStyleTag() {
  if (typeof document === 'undefined') {
    return;
  }
  document.getElementById(STYLE_TAG_ID)?.remove();
}

// The feedback overlay owns clicks while it is open (its picking mode claims
// them) — the Cmd/Ctrl+click shortcut stays out of the way until it closes.
// :not() skips this component's own highlight portal, which carries
// data-lowdefy-feedback purely for screenshot/picking exclusion.
function feedbackOverlayOpen() {
  return Boolean(
    document.querySelector('[data-lowdefy-feedback]:not([data-lowdefy-open-in-editor])')
  );
}

// Dev-only: Cmd/Ctrl+click any element to open the YAML that defines its
// block in VS Code (vscode://file deep link, at the exact line). While the
// modifier is held, the hovered block shows the same blue highlight box and
// blockId chip as the annotation overlay's picking mode, and the cursor
// switches to a pointer — so the developer sees exactly what a click will
// open. Mounted always-on from Routing.jsx alongside Inspector and
// FeedbackMount, and follows their resilience contract — every handler is
// try/caught so this can never take the app down with it.
//
// The click resolves the nearest block and, when that id is generated at
// runtime (list items, Dynamic endpoints), falls back through the ancestor
// block chain until an id resolves in config — the same strategy the
// feedback pipeline uses in enrichFeedback.js.
function OpenInEditorListener({ basePath, pageId }) {
  const [hoverBlock, setHoverBlock] = useState(null); // { blockId, rect }
  // Refs keep the freshest values without re-binding the capture listeners
  // on every SPA navigation or hover change.
  const pageIdRef = useRef(pageId);
  pageIdRef.current = pageId;
  const hoverRef = useRef(hoverBlock);
  hoverRef.current = hoverBlock;
  const lastPointerRef = useRef(null); // { x, y }

  // Style tag lifecycle — the listener is always mounted, so this lives for
  // the app's lifetime and only the body class toggles per hover.
  useEffect(() => {
    injectStyleTag();
    return () => removeStyleTag();
  }, []);

  // Pointer cursor only while a block is highlighted — over non-block areas
  // the cursor stays native, signalling the click would do nothing.
  useEffect(() => {
    try {
      document.body.classList.toggle(BODY_CLASS, Boolean(hoverBlock));
    } catch {
      // no-op
    }
    return () => {
      try {
        document.body.classList.remove(BODY_CLASS);
      } catch {
        // no-op
      }
    };
  }, [hoverBlock]);

  useEffect(() => {
    function clearHover() {
      if (hoverRef.current) {
        setHoverBlock(null);
      }
    }

    function resolveHover() {
      try {
        const point = lastPointerRef.current;
        if (!point || feedbackOverlayOpen()) {
          clearHover();
          return;
        }
        const el = document.elementFromPoint(point.x, point.y);
        const blockId = nearestBlock(el);
        const blockEl = blockId ? document.getElementById(`bl-${blockId}`) : null;
        if (!blockEl) {
          clearHover();
          return;
        }
        const rect = blockEl.getBoundingClientRect();
        setHoverBlock({
          blockId,
          rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
        });
      } catch {
        clearHover();
      }
    }

    function onPointerMove(event) {
      try {
        lastPointerRef.current = { x: event.clientX, y: event.clientY };
        if (event.metaKey || event.ctrlKey) {
          resolveHover();
        } else {
          clearHover();
        }
      } catch {
        // Best-effort hover tracking.
      }
    }

    // Modifier pressed/released while the mouse is stationary — pointermove
    // alone would leave the highlight stale.
    function onKeyDown(event) {
      if (event.key === 'Meta' || event.key === 'Control') {
        resolveHover();
      }
    }

    function onKeyUp(event) {
      if (event.key === 'Meta' || event.key === 'Control') {
        clearHover();
      }
    }

    // Cmd+Tab away releases the modifier without a keyup reaching the page.
    function onBlur() {
      clearHover();
    }

    // Keep the highlight glued to the block while the app scrolls under a
    // stationary cursor.
    function onScroll() {
      if (hoverRef.current) {
        resolveHover();
      }
    }

    async function openBlockInEditor({ candidates }) {
      for (const blockId of candidates) {
        const location = await findBlockLocation({
          basePath,
          blockId,
          pageId: pageIdRef.current,
        });
        if (location) {
          window.location.assign(`vscode://file${location.file}:${location.line}`);
          return;
        }
      }
      try {
        // eslint-disable-next-line no-console
        console.info(
          `Lowdefy: no config location found for "${candidates[0]}" — the block is generated at runtime.`
        );
      } catch {
        // no-op
      }
    }

    function onClickCapture(event) {
      try {
        if (!(event.metaKey || event.ctrlKey) || event.shiftKey || event.altKey) {
          return;
        }
        if (feedbackOverlayOpen()) {
          return;
        }
        const candidates = blockAncestorChain(event.target);
        if (candidates.length === 0) {
          return;
        }
        // Only claim the click once a block is under the cursor — plain
        // Cmd/Ctrl+clicks elsewhere keep their default behaviour.
        event.preventDefault();
        event.stopPropagation();
        void openBlockInEditor({ candidates });
      } catch {
        // Never let the shortcut break the developer's app.
      }
    }

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('click', onClickCapture, { capture: true });
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('click', onClickCapture, { capture: true });
    };
  }, [basePath]);

  if (!hoverBlock || typeof document === 'undefined' || !document.body) {
    return null;
  }
  // data-lowdefy-feedback keeps this out of the annotation overlay's element
  // picking and out of tab-captured screenshots (both exclude that root).
  return createPortal(
    <div data-lowdefy-feedback data-lowdefy-open-in-editor style={overlayContainer}>
      <div
        style={{
          ...highlightBox,
          top: hoverBlock.rect.top,
          left: hoverBlock.rect.left,
          width: hoverBlock.rect.width,
          height: hoverBlock.rect.height,
        }}
      >
        <span style={labelChip}>{hoverBlock.blockId}</span>
      </div>
    </div>,
    document.body
  );
}

export default OpenInEditorListener;
