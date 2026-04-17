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

import { useEffect, useState } from 'react';

const MIN_DELAY = 500;
const DEFAULT_DELAY = 3000;
const DEFAULT_INTERVAL = 8000;

function toList(messages) {
  if (typeof messages === 'string' && messages.length > 0) return [messages];
  if (Array.isArray(messages)) {
    const filtered = messages.filter((m) => typeof m === 'string' && m.length > 0);
    return filtered.length > 0 ? filtered : null;
  }
  return null;
}

// React hook: returns the current thinking-message label string, or null.
// - `active`: true while the loading state is visible (bubble has `loading: true`).
// - `messages`: string or string[] to show / rotate through. Falsy = feature off.
// - `delay`: ms before the first label appears after `active` becomes true.
// - `interval`: ms between rotations when `messages` has 2+ entries.
// - `resetKey`: stable identifier (usually the loading bubble's id). Changing it restarts timers.
//
// The hook keeps all timer lifecycle inside a single useEffect. When `active` flips
// false (or `resetKey`/`messages` change, or the component unmounts) cleanup fires
// and clears both the delay timeout and the rotation interval — no leaks.
export default function useThinkingMessage({ active, messages, delay, interval, resetKey }) {
  const list = toList(messages);
  const listSize = list?.length ?? 0;
  // Serialize for useEffect dependency — array identity changes on every render
  // for YAML-sourced config, but only content changes matter.
  const listKey = list ? list.join('\u0000') : '';

  const effectiveDelay = Math.max(
    MIN_DELAY,
    typeof delay === 'number' && delay >= 0 ? delay : DEFAULT_DELAY
  );
  const effectiveInterval =
    typeof interval === 'number' && interval > 0 ? interval : DEFAULT_INTERVAL;

  // -1 means "delay not yet elapsed, no label to show"
  const [index, setIndex] = useState(-1);

  useEffect(() => {
    setIndex(-1);
    if (!active || listSize === 0) return undefined;

    let rotationId = null;
    const delayId = setTimeout(() => {
      setIndex(0);
      if (listSize >= 2) {
        rotationId = setInterval(() => {
          setIndex((i) => (i + 1) % listSize);
        }, effectiveInterval);
      }
    }, effectiveDelay);

    return () => {
      clearTimeout(delayId);
      if (rotationId !== null) clearInterval(rotationId);
    };
  }, [active, listSize, listKey, effectiveDelay, effectiveInterval, resetKey]);

  if (!active || listSize === 0 || index < 0) return null;
  return list[index];
}
