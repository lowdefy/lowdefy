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

import { useRef, useState } from 'react';

function same(a, b) {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

// Local state for an editor whose value round-trips through the table. Filter writes apply in a
// transition, so the committed value can lag several edits behind; an editor that re-read it
// after each edit would build the next edit on a stale condition. The editor keeps its own state
// and writes through `onChange`; a value that arrives from outside (SetState, another editor)
// replaces it.
function useSyncedState({ value, onChange }) {
  const [local, setLocal] = useState(value);
  const sent = useRef(value);
  const [seen, setSeen] = useState(value);
  if (!same(seen, value)) {
    setSeen(value);
    if (!same(value, sent.current)) {
      sent.current = value;
      setLocal(value);
    }
  }
  function update(next) {
    sent.current = next;
    setLocal(next);
    onChange(next);
  }
  return [local, update];
}

export default useSyncedState;
