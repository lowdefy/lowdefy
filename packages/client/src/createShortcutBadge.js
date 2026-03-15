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

import React from 'react';

const badgeStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '2px',
  marginLeft: '8px',
  fontSize: '11px',
  lineHeight: 1,
  verticalAlign: 'middle',
};

const kbdStyle = {
  display: 'inline-block',
  padding: '2px 5px',
  fontSize: '11px',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  backgroundColor: '#f0f0f0',
  borderRadius: '3px',
  border: '1px solid #d0d0d0',
};

const SPECIAL_KEY_DISPLAY = {
  Escape: 'Esc',
  Enter: '↵',
  Backspace: '⌫',
  Delete: '⌦',
  ArrowUp: '↑',
  ArrowDown: '↓',
  ArrowLeft: '←',
  ArrowRight: '→',
  Tab: '⇥',
  Space: '␣',
};

const MAC_MODIFIERS = {
  mod: '⌘',
  shift: '⇧',
  alt: '⌥',
  ctrl: '⌃',
};

const WIN_MODIFIERS = {
  mod: 'Ctrl',
  shift: 'Shift',
  alt: 'Alt',
  ctrl: 'Ctrl',
};

let isMacCached = null;

function isMac() {
  if (isMacCached !== null) return isMacCached;
  if (typeof navigator !== 'undefined') {
    isMacCached =
      navigator.userAgentData?.platform === 'macOS' ||
      /Mac|iPhone|iPad|iPod/.test(navigator.platform ?? '');
  } else {
    isMacCached = false;
  }
  return isMacCached;
}

function parseShortcut(shortcut) {
  // Sequence: "g i" → ["G", "then", "I"]
  if (shortcut.includes(' ') && !shortcut.includes('+')) {
    const parts = shortcut.split(' ');
    const result = [];
    parts.forEach((part, i) => {
      if (i > 0) result.push('then');
      result.push(displayKey(part));
    });
    return result;
  }
  if (shortcut.includes(' ')) {
    // Sequence with modifiers: "mod+G mod+I"
    const parts = shortcut.split(' ');
    const result = [];
    parts.forEach((part, i) => {
      if (i > 0) result.push('then');
      result.push(...parsePart(part));
    });
    return result;
  }
  return parsePart(shortcut);
}

function parsePart(part) {
  const segments = part.split('+');
  if (segments.length === 1) {
    return [displayKey(segments[0])];
  }
  const key = segments[segments.length - 1];
  const modifiers = segments.slice(0, -1);
  const modMap = isMac() ? MAC_MODIFIERS : WIN_MODIFIERS;
  const result = modifiers.map((mod) => modMap[mod.toLowerCase()] || mod);
  result.push(displayKey(key));
  return result;
}

function displayKey(key) {
  if (SPECIAL_KEY_DISPLAY[key]) return SPECIAL_KEY_DISPLAY[key];
  if (key.length === 1) return key.toUpperCase();
  return key;
}

function createShortcutBadge() {
  function ShortcutBadge({ shortcut }) {
    if (!shortcut) return null;
    const primary = Array.isArray(shortcut) ? shortcut[0] : shortcut;
    if (!primary) return null;

    const segments = parseShortcut(primary);

    return (
      <span className="lf-shortcut-badge" style={badgeStyle}>
        {segments.map((segment, i) =>
          segment === 'then' ? (
            <span key={i} style={{ margin: '0 2px', fontSize: '10px' }}>
              then
            </span>
          ) : (
            <kbd key={i} style={kbdStyle}>
              {segment}
            </kbd>
          )
        )}
      </span>
    );
  }

  return ShortcutBadge;
}

export default createShortcutBadge;
