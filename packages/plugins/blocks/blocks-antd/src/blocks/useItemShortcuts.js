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

import { useEffect, useRef } from 'react';

import isMac from './isMac.js';
import parseShortcut from './parseShortcut.js';

function matchesShortcut(e, parsed) {
  if (!parsed) return false;
  const modPressed = parsed.mod ? (isMac ? e.metaKey : e.ctrlKey) : true;
  const ctrlPressed = parsed.ctrl ? e.ctrlKey : true;
  const shiftPressed = parsed.shift ? e.shiftKey : !e.shiftKey;
  const altPressed = parsed.alt ? e.altKey : !e.altKey;
  return (
    modPressed && ctrlPressed && shiftPressed && altPressed && e.key.toLowerCase() === parsed.key
  );
}

function useItemShortcuts({ items, onMatch }) {
  const itemsKey = JSON.stringify(items);
  // The listener reads the latest onMatch, so a caller passing a new function each render does
  // not re-register it on the document every render.
  const onMatchRef = useRef(onMatch);
  onMatchRef.current = onMatch;
  useEffect(() => {
    const parsedItems = (items ?? [])
      .filter((item) => item.shortcut && !item.disabled)
      .map((item) => ({ key: item.key, parsed: parseShortcut(item.shortcut) }));

    if (parsedItems.length === 0) return;

    function handleKeyDown(e) {
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target?.isContentEditable) {
        return;
      }
      for (const { key, parsed } of parsedItems) {
        if (matchesShortcut(e, parsed)) {
          e.preventDefault();
          onMatchRef.current(key);
          return;
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [itemsKey]);
}

export default useItemShortcuts;
