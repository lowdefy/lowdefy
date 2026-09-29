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

import { useCallback, useEffect, useRef, useState } from 'react';

function same(a, b) {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

// A typed value that applies after a pause (or at once on flush: Enter, blur, unmount), so a
// 100k-row filter is not re-run and committed on every keystroke. A new value from outside
// (SetState, another editor) replaces the draft.
function useDraft({ value, onChange, delay = 300 }) {
  const [draft, setDraftState] = useState(value);
  const sent = useRef(value);
  const pending = useRef({ draft: value, onChange, timer: null });
  pending.current.onChange = onChange;

  useEffect(() => {
    if (same(value, sent.current)) return;
    sent.current = value;
    pending.current.draft = value;
    setDraftState(value);
  }, [value]);

  const flush = useCallback(() => {
    const current = pending.current;
    clearTimeout(current.timer);
    current.timer = null;
    if (same(current.draft, sent.current)) return;
    sent.current = current.draft;
    current.onChange(current.draft);
  }, []);

  const setDraft = useCallback(
    (next) => {
      pending.current.draft = next;
      setDraftState(next);
      clearTimeout(pending.current.timer);
      pending.current.timer = setTimeout(flush, delay);
    },
    [delay, flush]
  );

  useEffect(() => flush, [flush]);

  return { draft, setDraft, flush };
}

export default useDraft;
