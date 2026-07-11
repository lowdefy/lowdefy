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

// Visual language: subtle dark chrome panels floating over the app, kept
// above ErrorBar.jsx (bottom: 40px, zIndex 99999) but under nothing — this
// overlay is the topmost thing on the page while active.

const STYLE_TAG_ID = 'lowdefy-feedback-style-tag';

const colors = {
  panelBg: 'rgba(20,20,25,0.92)',
  panelBorder: 'rgba(255,255,255,0.12)',
  text: '#ffffff',
  textMuted: 'rgba(255,255,255,0.6)',
  accent: '#4f9cf9',
  accentBg: 'rgba(79,156,249,0.08)',
  stroke: '#ff4785',
  strokeBg: 'rgba(255,71,133,0.08)',
};

const fontFamily =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

const overlayContainer = {
  position: 'fixed',
  inset: 0,
  zIndex: 2147483000,
  fontFamily,
  fontSize: 13,
  color: colors.text,
  pointerEvents: 'none',
};

const highlightBox = {
  position: 'fixed',
  border: `2px solid ${colors.accent}`,
  backgroundColor: colors.accentBg,
  borderRadius: 4,
  pointerEvents: 'none',
  transition: 'top 60ms ease, left 60ms ease, width 60ms ease, height 60ms ease',
  boxSizing: 'border-box',
};

const selectedHighlightBox = {
  ...highlightBox,
  border: `2px solid ${colors.stroke}`,
  backgroundColor: colors.strokeBg,
  transition: 'none',
};

const labelChip = {
  position: 'absolute',
  top: -22,
  left: -2,
  backgroundColor: colors.accent,
  color: '#fff',
  fontSize: 11,
  lineHeight: '16px',
  padding: '2px 6px',
  borderRadius: 4,
  whiteSpace: 'nowrap',
  pointerEvents: 'none',
};

const selectedLabelChip = {
  ...labelChip,
  backgroundColor: colors.stroke,
};

const panelBase = {
  position: 'fixed',
  width: 320,
  backgroundColor: colors.panelBg,
  border: `1px solid ${colors.panelBorder}`,
  borderRadius: 8,
  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
  padding: 14,
  boxSizing: 'border-box',
  pointerEvents: 'auto',
};

const annotatingPanel = {
  ...panelBase,
  bottom: 40,
  right: 16,
};

const reviewTray = {
  ...panelBase,
  bottom: 40,
  left: 16,
  width: 300,
  maxHeight: '60vh',
  overflowY: 'auto',
};

const sentBanner = {
  ...panelBase,
  bottom: 40,
  right: 16,
  textAlign: 'center',
  color: '#7ee787',
  fontWeight: 600,
};

const panelHeading = {
  fontSize: 12,
  fontWeight: 600,
  marginBottom: 8,
  color: colors.textMuted,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

const descriptorRow = {
  fontSize: 12,
  color: colors.textMuted,
  marginBottom: 10,
  wordBreak: 'break-word',
};

const textareaStyle = {
  width: '100%',
  minHeight: 72,
  resize: 'vertical',
  backgroundColor: 'rgba(255,255,255,0.06)',
  border: `1px solid ${colors.panelBorder}`,
  borderRadius: 6,
  color: colors.text,
  fontFamily,
  fontSize: 13,
  padding: 8,
  boxSizing: 'border-box',
  marginBottom: 10,
};

const toolRow = {
  display: 'flex',
  gap: 6,
  marginBottom: 10,
};

function toolButtonStyle(active) {
  return {
    flex: 1,
    padding: '6px 0',
    borderRadius: 6,
    border: `1px solid ${active ? colors.accent : colors.panelBorder}`,
    backgroundColor: active ? colors.accentBg : 'rgba(255,255,255,0.04)',
    color: colors.text,
    cursor: 'pointer',
    fontSize: 12,
  };
}

const buttonRow = {
  display: 'flex',
  gap: 8,
  justifyContent: 'flex-end',
  flexWrap: 'wrap',
};

const primaryButton = {
  padding: '6px 14px',
  borderRadius: 6,
  border: 'none',
  backgroundColor: colors.accent,
  color: '#fff',
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 600,
};

const secondaryButton = {
  padding: '6px 14px',
  borderRadius: 6,
  border: `1px solid ${colors.panelBorder}`,
  backgroundColor: 'transparent',
  color: colors.textMuted,
  cursor: 'pointer',
  fontSize: 12,
};

const dangerButton = {
  ...secondaryButton,
  color: '#ff8080',
};

const reviewItem = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 8,
  padding: '8px 0',
  borderBottom: `1px solid ${colors.panelBorder}`,
  fontSize: 12,
};

const reviewItemRemove = {
  background: 'none',
  border: 'none',
  color: colors.textMuted,
  cursor: 'pointer',
  fontSize: 14,
  lineHeight: 1,
  padding: 0,
};

const consoleCountRow = {
  fontSize: 11,
  color: colors.textMuted,
  margin: '10px 0',
};

const errorRow = {
  fontSize: 11,
  color: '#ff8080',
  marginBottom: 8,
};

const svgLayer = {
  position: 'fixed',
  inset: 0,
  width: '100%',
  height: '100%',
};

// A few rules inline styles can't express: forcing cursor over arbitrary app
// descendants during pick/draw modes and a placeholder color. The arrowhead
// SVG marker is defined inline in the overlay's <defs> instead — no
// stylesheet needed for that.
function injectFeedbackStyleTag() {
  if (typeof document === 'undefined' || document.getElementById(STYLE_TAG_ID)) {
    return;
  }
  const style = document.createElement('style');
  style.id = STYLE_TAG_ID;
  style.textContent = `
    .lowdefy-feedback-picking, .lowdefy-feedback-picking * {
      cursor: crosshair !important;
    }
    .lowdefy-feedback-drawing, .lowdefy-feedback-drawing * {
      cursor: crosshair !important;
    }
    [data-lowdefy-feedback] textarea::placeholder {
      color: rgba(255,255,255,0.4);
    }
  `;
  document.head.appendChild(style);
}

function removeFeedbackStyleTag() {
  if (typeof document === 'undefined') {
    return;
  }
  const existing = document.getElementById(STYLE_TAG_ID);
  if (existing) {
    existing.remove();
  }
}

export {
  colors,
  overlayContainer,
  highlightBox,
  selectedHighlightBox,
  labelChip,
  selectedLabelChip,
  annotatingPanel,
  reviewTray,
  sentBanner,
  panelHeading,
  descriptorRow,
  textareaStyle,
  toolRow,
  toolButtonStyle,
  buttonRow,
  primaryButton,
  secondaryButton,
  dangerButton,
  reviewItem,
  reviewItemRemove,
  consoleCountRow,
  errorRow,
  svgLayer,
  injectFeedbackStyleTag,
  removeFeedbackStyleTag,
};
