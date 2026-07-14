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

import React, { useEffect, useReducer, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { blockAncestorChain, describeElement, nearestBlock } from './elementInspect.js';
import {
  annotatingPanel,
  buttonRow,
  colors,
  consoleCountRow,
  dangerButton,
  descriptorRow,
  errorRow,
  highlightBox,
  labelChip,
  overlayContainer,
  panelHeading,
  primaryButton,
  reviewItem,
  reviewItemRemove,
  reviewTray,
  secondaryButton,
  selectedHighlightBox,
  selectedLabelChip,
  sentBanner,
  svgLayer,
  textareaStyle,
  toolButtonStyle,
  toolRow,
  injectFeedbackStyleTag,
  removeFeedbackStyleTag,
} from './feedbackStyles.js';
import copyToClipboard from './copyToClipboard.js';
import sendFeedback from './sendFeedback.js';

const FEEDBACK_ROOT_SELECTOR = '[data-lowdefy-feedback]';
const FREEHAND_MIN_SAMPLE_DIST = 4;
const MIN_SHAPE_SIZE = 2;
const SENT_CLOSE_DELAY_MS = 1200;

const TOOL_LABELS = { rect: 'Rectangle', arrow: 'Arrow', freehand: 'Freehand' };

function generateId() {
  try {
    return crypto.randomUUID();
  } catch {
    return `fb-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}

// Used internally for CSS positioning (top/left) of highlight boxes.
function rectToPlain(rect) {
  return { top: rect.top, left: rect.left, width: rect.width, height: rect.height };
}

// Used for the wire contract (x/y), which the dev server's formatFeedback.js
// and enrichFeedback.js are built against.
function rectToXY(rect) {
  return { x: rect.left, y: rect.top, width: rect.width, height: rect.height };
}

const initialState = {
  phase: 'picking', // picking | annotating | drawing | review | sent
  hoverBlock: null, // { blockId, rect }
  selection: null, // { kind, blockId, blockChain, tag, classes, text, rect }
  draftComment: '',
  draftTool: null, // rect | arrow | freehand
  draftShapes: [],
  batch: [],
  includeScreenshot: true,
  sending: false,
  sendError: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'TOGGLE_SCREENSHOT':
      return { ...state, includeScreenshot: !state.includeScreenshot };
    case 'HOVER_BLOCK':
      return { ...state, hoverBlock: action.hoverBlock };
    case 'LOCK_SELECTION':
      return {
        ...state,
        phase: 'annotating',
        hoverBlock: null,
        selection: action.selection,
        draftComment: '',
        draftTool: null,
        draftShapes: [],
      };
    case 'UPDATE_HOVER_RECT':
      if (!state.hoverBlock) return state;
      return { ...state, hoverBlock: { ...state.hoverBlock, rect: action.rect } };
    case 'UPDATE_SELECTION_RECT':
      if (!state.selection) return state;
      return { ...state, selection: { ...state.selection, rect: action.rect } };
    case 'SET_COMMENT':
      return { ...state, draftComment: action.comment };
    case 'START_DRAWING':
      return { ...state, phase: 'drawing', draftTool: action.tool };
    case 'ADD_SHAPE':
      return {
        ...state,
        phase: 'annotating',
        draftTool: null,
        draftShapes: [...state.draftShapes, action.shape],
      };
    case 'CANCEL_DRAWING':
      return { ...state, phase: 'annotating', draftTool: null };
    case 'SAVE_ANNOTATION':
      return {
        ...state,
        phase: 'review',
        batch: [...state.batch, action.annotation],
        selection: null,
        draftComment: '',
        draftTool: null,
        draftShapes: [],
      };
    case 'DISCARD_DRAFT':
      return {
        ...state,
        phase: 'picking',
        hoverBlock: null,
        selection: null,
        draftComment: '',
        draftTool: null,
        draftShapes: [],
      };
    case 'REMOVE_FROM_BATCH':
      return { ...state, batch: state.batch.filter((annotation) => annotation.id !== action.id) };
    case 'ADD_ANOTHER':
      return { ...state, phase: 'picking' };
    case 'DISCARD_ALL':
      return { ...state, phase: 'picking', batch: [] };
    case 'BACK_TO_PICKING':
      return { ...state, phase: 'picking' };
    case 'SEND_START':
      return { ...state, sending: true, sendError: null };
    case 'SEND_SUCCESS':
      return { ...state, sending: false, phase: 'sent' };
    case 'SEND_ERROR':
      return { ...state, sending: false, sendError: action.error };
    default:
      return state;
  }
}

// Matches the dev server's contract exactly (see
// lib/docs/formatFeedback.js / enrichFeedback.js and their tests):
// kind is "element" | "region"; target is null for a region (there is no
// block to attach a config location to); geometry.elementRect uses x/y (a
// DOMRect's x/y are the same values as its top/left, just renamed for the
// wire format); shapes carry a uniform `points` array regardless of tool.
function buildAnnotation(state) {
  const { selection, draftComment, draftShapes } = state;
  const isElement = selection.kind === 'element';
  return {
    id: generateId(),
    kind: selection.kind,
    comment: draftComment,
    target: isElement
      ? {
          blockId: selection.blockId,
          ancestorBlockIds: selection.blockChain,
          tag: selection.tag,
          text: selection.text,
        }
      : null,
    geometry: {
      elementRect: isElement && selection.rect ? rectToXY(selection.rect) : null,
      shapes: draftShapes,
    },
  };
}

function buildBatch({ state, pageId }) {
  return {
    batchId: generateId(),
    timestamp: new Date().toISOString(),
    pageId,
    url: `${window.location.pathname}${window.location.search}`,
    urlQuery: window.location.search,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
      scrollX: window.scrollX,
      scrollY: window.scrollY,
      dpr: window.devicePixelRatio,
    },
    annotations: state.batch,
    includeScreenshot: state.includeScreenshot,
    stateRef: { captured: true, pageId },
  };
}

function handleEscape({ stateRef, dispatch, onClose }) {
  const { phase, batch } = stateRef.current;
  if (phase === 'drawing') {
    dispatch({ type: 'CANCEL_DRAWING' });
    return;
  }
  if (phase === 'annotating') {
    dispatch({ type: 'DISCARD_DRAFT' });
    return;
  }
  if (phase === 'review') {
    dispatch({ type: 'BACK_TO_PICKING' });
    return;
  }
  // picking (or sent, though Esc is irrelevant there)
  try {
    if (batch.length > 0) {
      const confirmed = window.confirm(
        `Discard ${batch.length} pending annotation${batch.length === 1 ? '' : 's'}?`
      );
      if (!confirmed) {
        return;
      }
    }
  } catch {
    // If confirm() itself throws (unlikely), fall through and close anyway.
  }
  if (onClose) {
    onClose();
  }
}

// Every shape carries a uniform `points` array (the wire contract's shape),
// interpreted per type: rect = [topLeft, bottomRight], arrow = [tail, head],
// freehand = the full sampled path.
function renderShape(shape, key) {
  if (shape.type === 'rect') {
    const [a, b] = shape.points;
    return (
      <rect
        key={key}
        x={a.x}
        y={a.y}
        width={b.x - a.x}
        height={b.y - a.y}
        stroke={colors.stroke}
        strokeWidth={2}
        fill={colors.strokeBg}
      />
    );
  }
  if (shape.type === 'arrow') {
    const [a, b] = shape.points;
    return (
      <line
        key={key}
        x1={a.x}
        y1={a.y}
        x2={b.x}
        y2={b.y}
        stroke={colors.stroke}
        strokeWidth={2}
        markerEnd="url(#lowdefy-feedback-arrowhead)"
      />
    );
  }
  if (shape.type === 'freehand') {
    return (
      <polyline
        key={key}
        points={shape.points.map((point) => `${point.x},${point.y}`).join(' ')}
        stroke={colors.stroke}
        strokeWidth={2}
        fill="none"
      />
    );
  }
  return null;
}

// The overlay itself. Everything here is dev-only and must never take the
// app down with it — event handlers are individually try/caught, and the
// whole render is wrapped so a bad state shape returns null rather than
// throwing into the app's React tree.
function FeedbackOverlay({ basePath, pageId, onClose }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const primarySendRef = useRef(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const textareaRef = useRef(null);
  const drawStartRef = useRef(null);
  const freehandPointsRef = useRef([]);
  const [isDrawingShape, setIsDrawingShape] = useState(false);
  const [drawPreview, setDrawPreview] = useState(null);

  // Style tag lifecycle — installed for the overlay's lifetime only.
  useEffect(() => {
    injectFeedbackStyleTag();
    return () => removeFeedbackStyleTag();
  }, []);

  // Capture-phase keydown suppressor: blocks every key from reaching the
  // app's own shortcut manager while the overlay is active, except when the
  // developer is typing inside the overlay itself (e.g. the comment
  // textarea). Esc and $mod+Enter are handled here first, before deciding
  // whether to suppress, so they always work regardless of focus.
  useEffect(() => {
    function onKeyDown(event) {
      try {
        const insideOverlay =
          event.target instanceof Element && Boolean(event.target.closest(FEEDBACK_ROOT_SELECTOR));

        if (event.key === 'Escape') {
          event.preventDefault();
          handleEscape({ stateRef, dispatch, onClose });
          event.stopImmediatePropagation();
          return;
        }

        // Enter drives the primary (blue) action for the current phase;
        // Shift+Enter still inserts a newline in the comment textarea.
        const isPlainEnter = event.key === 'Enter' && !event.shiftKey;
        if (isPlainEnter) {
          const current = stateRef.current;
          if (current.phase === 'annotating' && current.selection) {
            event.preventDefault();
            dispatch({ type: 'SAVE_ANNOTATION', annotation: buildAnnotation(current) });
            event.stopImmediatePropagation();
            return;
          }
          if (current.phase === 'review' && !current.sending && current.batch.length > 0) {
            event.preventDefault();
            primarySendRef.current?.();
            event.stopImmediatePropagation();
            return;
          }
        }

        if (!insideOverlay) {
          event.stopImmediatePropagation();
        }
      } catch {
        // Never let a keyboard-handling bug break the developer's app.
      }
    }

    window.addEventListener('keydown', onKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', onKeyDown, { capture: true });
  }, [onClose]);

  // Cursor styling for pick/draw modes.
  useEffect(() => {
    const body = document.body;
    try {
      body.classList.toggle('lowdefy-feedback-picking', state.phase === 'picking');
      body.classList.toggle('lowdefy-feedback-drawing', state.phase === 'drawing');
    } catch {
      // no-op
    }
    return () => {
      try {
        body.classList.remove('lowdefy-feedback-picking', 'lowdefy-feedback-drawing');
      } catch {
        // no-op
      }
    };
  }, [state.phase]);

  // Picking mode: window-level pointermove drives the hover highlight,
  // capture-phase click locks the selection. The overlay container itself is
  // pointer-events:none so elementFromPoint always resolves to the real app
  // DOM underneath.
  useEffect(() => {
    if (state.phase !== 'picking') {
      return undefined;
    }

    function onPointerMove(event) {
      try {
        const el = document.elementFromPoint(event.clientX, event.clientY);
        const blockId = nearestBlock(el);
        if (!blockId) {
          dispatch({ type: 'HOVER_BLOCK', hoverBlock: null });
          return;
        }
        const blockEl = document.getElementById(`bl-${blockId}`);
        if (!blockEl) {
          dispatch({ type: 'HOVER_BLOCK', hoverBlock: null });
          return;
        }
        dispatch({
          type: 'HOVER_BLOCK',
          hoverBlock: { blockId, rect: rectToPlain(blockEl.getBoundingClientRect()) },
        });
      } catch {
        // Best-effort hover tracking.
      }
    }

    function onClickCapture(event) {
      try {
        event.preventDefault();
        event.stopPropagation();
        const el = document.elementFromPoint(event.clientX, event.clientY);
        const blockId = nearestBlock(el);

        if (blockId) {
          const blockEl = document.getElementById(`bl-${blockId}`);
          const descriptor = describeElement(blockEl ?? el);
          dispatch({
            type: 'LOCK_SELECTION',
            selection: {
              kind: 'element',
              blockId,
              blockChain: blockAncestorChain(el),
              tag: descriptor.tag,
              classes: descriptor.classes,
              text: descriptor.text,
              rect: blockEl ? rectToPlain(blockEl.getBoundingClientRect()) : null,
            },
          });
          return;
        }

        // No block under the cursor — start a region annotation instead.
        const descriptor = describeElement(el);
        dispatch({
          type: 'LOCK_SELECTION',
          selection: {
            kind: 'region',
            blockId: null,
            blockChain: [],
            tag: descriptor.tag,
            classes: descriptor.classes,
            text: descriptor.text,
            rect: { top: event.clientY, left: event.clientX, width: 0, height: 0 },
          },
        });
      } catch {
        // Best-effort selection locking.
      }
    }

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('click', onClickCapture, { capture: true });
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('click', onClickCapture, { capture: true });
    };
  }, [state.phase]);

  // Keep highlight/selection rects aligned with the app underneath as the
  // developer scrolls or resizes the window.
  useEffect(() => {
    function recompute() {
      try {
        if (stateRef.current.hoverBlock) {
          const el = document.getElementById(`bl-${stateRef.current.hoverBlock.blockId}`);
          if (el) {
            dispatch({ type: 'UPDATE_HOVER_RECT', rect: rectToPlain(el.getBoundingClientRect()) });
          }
        }
        if (stateRef.current.selection && stateRef.current.selection.kind === 'element') {
          const el = document.getElementById(`bl-${stateRef.current.selection.blockId}`);
          if (el) {
            dispatch({
              type: 'UPDATE_SELECTION_RECT',
              rect: rectToPlain(el.getBoundingClientRect()),
            });
          }
        }
      } catch {
        // Best-effort — a stale rect just corrects on the next event.
      }
    }
    window.addEventListener('scroll', recompute, true);
    window.addEventListener('resize', recompute);
    return () => {
      window.removeEventListener('scroll', recompute, true);
      window.removeEventListener('resize', recompute);
    };
  }, []);

  // Autofocus the comment textarea whenever a fresh selection is locked.
  useEffect(() => {
    if (state.phase === 'annotating' && textareaRef.current) {
      try {
        textareaRef.current.focus();
      } catch {
        // no-op
      }
    }
  }, [state.phase, state.selection]);

  // Auto-close shortly after a successful send.
  useEffect(() => {
    if (state.phase !== 'sent') {
      return undefined;
    }
    const timer = setTimeout(() => {
      if (onClose) {
        onClose();
      }
    }, SENT_CLOSE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [state.phase, onClose]);

  function handleDrawPointerDown(event) {
    try {
      event.preventDefault();
      const point = { x: event.clientX, y: event.clientY };
      if (state.draftTool === 'freehand') {
        freehandPointsRef.current = [point];
        setDrawPreview({ type: 'freehand', points: [point] });
      } else if (state.draftTool === 'rect' || state.draftTool === 'arrow') {
        // rect = [topLeft, bottomRight], arrow = [tail, head] — both start
        // as a degenerate two-point shape at the down position.
        drawStartRef.current = point;
        setDrawPreview({ type: state.draftTool, points: [point, point] });
      }
      setIsDrawingShape(true);
    } catch {
      // no-op
    }
  }

  function handleDrawPointerMove(event) {
    if (!isDrawingShape) {
      return;
    }
    try {
      const point = { x: event.clientX, y: event.clientY };
      if (state.draftTool === 'freehand') {
        const points = freehandPointsRef.current;
        const last = points[points.length - 1];
        if (Math.hypot(point.x - last.x, point.y - last.y) >= FREEHAND_MIN_SAMPLE_DIST) {
          points.push(point);
          setDrawPreview({ type: 'freehand', points: [...points] });
        }
      } else if (state.draftTool === 'rect') {
        const start = drawStartRef.current;
        setDrawPreview({
          type: 'rect',
          points: [
            { x: Math.min(start.x, point.x), y: Math.min(start.y, point.y) },
            { x: Math.max(start.x, point.x), y: Math.max(start.y, point.y) },
          ],
        });
      } else if (state.draftTool === 'arrow') {
        const start = drawStartRef.current;
        setDrawPreview({ type: 'arrow', points: [start, point] });
      }
    } catch {
      // no-op
    }
  }

  function handleDrawPointerUp() {
    try {
      const shape = drawPreview;
      let keep = Boolean(shape);
      if (shape?.type === 'rect') {
        const [a, b] = shape.points;
        if (Math.abs(b.x - a.x) < MIN_SHAPE_SIZE && Math.abs(b.y - a.y) < MIN_SHAPE_SIZE) {
          keep = false;
        }
      }
      if (shape?.type === 'arrow') {
        const [a, b] = shape.points;
        if (Math.hypot(b.x - a.x, b.y - a.y) < MIN_SHAPE_SIZE) {
          keep = false;
        }
      }
      if (shape?.type === 'freehand' && shape.points.length < 2) {
        keep = false;
      }
      if (keep) {
        dispatch({ type: 'ADD_SHAPE', shape });
      } else {
        dispatch({ type: 'CANCEL_DRAWING' });
      }
    } catch {
      dispatch({ type: 'CANCEL_DRAWING' });
    } finally {
      setIsDrawingShape(false);
      setDrawPreview(null);
      drawStartRef.current = null;
      freehandPointsRef.current = [];
    }
  }

  function handleSave() {
    try {
      if (!state.selection) {
        return;
      }
      dispatch({ type: 'SAVE_ANNOTATION', annotation: buildAnnotation(state) });
    } catch {
      // no-op
    }
  }

  async function handleSend() {
    try {
      dispatch({ type: 'SEND_START' });
      const batch = buildBatch({ state, pageId });
      // The server enriches annotations with yaml file:line locations and
      // returns the agent-readable text; the clipboard is the delivery
      // channel — the developer pastes it into whichever agent session
      // they choose.
      const formatted = await sendFeedback({ basePath, batch });
      if (formatted === null) {
        dispatch({
          type: 'SEND_ERROR',
          error: 'Could not format annotations. Check the dev server and try again.',
        });
        return;
      }
      const copied = await copyToClipboard({ text: formatted });
      if (copied) {
        dispatch({ type: 'SEND_SUCCESS' });
      } else {
        dispatch({
          type: 'SEND_ERROR',
          error: 'Could not copy to clipboard. Click the page once, then try again.',
        });
      }
    } catch {
      dispatch({
        type: 'SEND_ERROR',
        error: 'Could not copy annotations. Check the dev server and try again.',
      });
    }
  }
  // Enter in the review tray triggers the primary action via the capture
  // handler above — a ref keeps the freshest closure without re-binding.
  primarySendRef.current = handleSend;

  let content = null;
  try {
    content = renderOverlayContent({
      state,
      dispatch,
      textareaRef,
      handleSave,
      handleSend,
      handleDrawPointerDown,
      handleDrawPointerMove,
      handleDrawPointerUp,
      drawPreview,
    });
  } catch {
    content = null;
  }
  // Portal to document.body so the overlay is a top-level sibling of the app
  // root. Rendered inline it inherits the app root's stacking context, and an
  // open antd modal (portalled to body, zIndex ~1000) then paints above the
  // overlay regardless of its own zIndex — making the comment textarea
  // unclickable. As a body sibling its zIndex competes in the root stacking
  // context and wins.
  if (typeof document === 'undefined' || !document.body) {
    return content;
  }
  return createPortal(content, document.body);
}

// Pure render function kept outside the hook-bearing component body so a
// rendering bug can be caught by the try/catch above without affecting hook
// call order.
function renderOverlayContent({
  state,
  dispatch,
  textareaRef,
  handleSave,
  handleSend,
  handleDrawPointerDown,
  handleDrawPointerMove,
  handleDrawPointerUp,
  drawPreview,
}) {
  const showHighlightHover = state.phase === 'picking' && state.hoverBlock && state.hoverBlock.rect;
  const showSelection =
    (state.phase === 'annotating' || state.phase === 'drawing') &&
    state.selection &&
    state.selection.rect;
  const showAnnotatingPanel =
    (state.phase === 'annotating' || state.phase === 'drawing') && state.selection;
  const showSvg = state.phase === 'drawing';
  const showReview = state.phase === 'review';
  const showSent = state.phase === 'sent';

  return (
    <div data-lowdefy-feedback style={overlayContainer}>
      {showHighlightHover && (
        <div
          style={{
            ...highlightBox,
            top: state.hoverBlock.rect.top,
            left: state.hoverBlock.rect.left,
            width: state.hoverBlock.rect.width,
            height: state.hoverBlock.rect.height,
          }}
        >
          <span style={labelChip}>{state.hoverBlock.blockId}</span>
        </div>
      )}

      {showSelection && (
        <div
          style={{
            ...selectedHighlightBox,
            top: state.selection.rect.top,
            left: state.selection.rect.left,
            width: state.selection.rect.width,
            height: state.selection.rect.height,
          }}
        >
          <span style={selectedLabelChip}>{state.selection.blockId ?? 'region'}</span>
        </div>
      )}

      {showSvg && (
        <svg
          style={{ ...svgLayer, pointerEvents: 'auto' }}
          onPointerDown={handleDrawPointerDown}
          onPointerMove={handleDrawPointerMove}
          onPointerUp={handleDrawPointerUp}
        >
          <defs>
            <marker
              id="lowdefy-feedback-arrowhead"
              markerWidth="10"
              markerHeight="10"
              refX="8"
              refY="5"
              orient="auto"
            >
              <polygon points="0,0 10,5 0,10" fill={colors.stroke} />
            </marker>
          </defs>
          {state.draftShapes.map((shape, index) => renderShape(shape, `saved-${index}`))}
          {drawPreview && renderShape(drawPreview, 'preview')}
        </svg>
      )}

      {showAnnotatingPanel && (
        <div style={annotatingPanel}>
          <div style={panelHeading}>Add feedback</div>
          <div style={descriptorRow}>
            {state.selection.tag ? `<${state.selection.tag}> ` : ''}
            {state.selection.blockId ? `#${state.selection.blockId}` : '(region)'}
            {state.selection.text ? ` — "${state.selection.text}"` : ''}
          </div>
          <textarea
            ref={textareaRef}
            style={textareaStyle}
            placeholder="What's wrong, or what should change?"
            value={state.draftComment}
            onChange={(event) => dispatch({ type: 'SET_COMMENT', comment: event.target.value })}
          />
          <div style={toolRow}>
            {['rect', 'arrow', 'freehand'].map((tool) => (
              <button
                key={tool}
                type="button"
                style={toolButtonStyle(state.phase === 'drawing' && state.draftTool === tool)}
                onClick={() => dispatch({ type: 'START_DRAWING', tool })}
              >
                {TOOL_LABELS[tool]}
              </button>
            ))}
          </div>
          {state.draftShapes.length > 0 && (
            <div style={descriptorRow}>{state.draftShapes.length} shape(s) drawn</div>
          )}
          <div style={buttonRow}>
            <button
              type="button"
              style={secondaryButton}
              onClick={() => dispatch({ type: 'DISCARD_DRAFT' })}
            >
              Cancel
            </button>
            <button type="button" style={primaryButton} onClick={handleSave}>
              Save annotation
            </button>
          </div>
        </div>
      )}

      {showReview && (
        <div style={reviewTray}>
          <div style={panelHeading}>Pending feedback ({state.batch.length})</div>
          {state.batch.map((annotation, index) => (
            <div key={annotation.id} style={reviewItem}>
              <div>
                <div>
                  {index + 1}. {annotation.target?.blockId ?? 'region'}
                </div>
                <div style={{ color: colors.textMuted }}>
                  {(annotation.comment ?? '').split('\n')[0].slice(0, 80) || '(no comment)'}
                </div>
                <div style={{ color: colors.textMuted, fontSize: 11 }}>
                  {annotation.geometry.shapes.length} shape(s)
                </div>
              </div>
              <button
                type="button"
                style={reviewItemRemove}
                aria-label="Remove annotation"
                onClick={() => dispatch({ type: 'REMOVE_FROM_BATCH', id: annotation.id })}
              >
                ✕
              </button>
            </div>
          ))}
          <label style={consoleCountRow}>
            <input
              checked={state.includeScreenshot}
              onChange={() => dispatch({ type: 'TOGGLE_SCREENSHOT' })}
              style={{ marginRight: 6, verticalAlign: 'middle' }}
              type="checkbox"
            />
            Include annotated screenshot
          </label>
          {state.sendError && <div style={errorRow}>{state.sendError}</div>}
          <div style={buttonRow}>
            <button
              type="button"
              style={dangerButton}
              onClick={() => dispatch({ type: 'DISCARD_ALL' })}
            >
              Discard all
            </button>
            <button
              type="button"
              style={secondaryButton}
              onClick={() => dispatch({ type: 'ADD_ANOTHER' })}
            >
              Add another
            </button>
            <button
              type="button"
              style={primaryButton}
              disabled={state.sending || state.batch.length === 0}
              onClick={handleSend}
            >
              {state.sending ? 'Copying…' : `Copy ${state.batch.length} for agent`}
            </button>
          </div>
        </div>
      )}

      {showSent && <div style={sentBanner}>Copied to clipboard ✓ — paste into your agent</div>}
    </div>
  );
}

export default FeedbackOverlay;
