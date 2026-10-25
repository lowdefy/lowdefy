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

import { useState, useCallback } from 'react';

// The index adds match data to each hit; only the stored fields are kept.
const SEARCH_ONLY_FIELDS = ['score', 'terms', 'queryTerms', 'match'];

function toStoredResult(item) {
  const stored = { ...item };
  for (const field of SEARCH_ONLY_FIELDS) delete stored[field];
  return stored;
}

function sameResult(a, b) {
  if (a.id !== undefined && a.id !== null) return a.id === b.id;
  return JSON.stringify(a) === JSON.stringify(b);
}

function addRecentResult(recent, item, maxCount) {
  const stored = toStoredResult(item);
  return [stored, ...recent.filter((entry) => !sameResult(entry, stored))].slice(0, maxCount);
}

function readStored(key) {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStored(key, items) {
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch {
    // localStorage unavailable
  }
}

// Recent results are the signed-in person's data, so like recent searches they are kept under a
// user key: cleared at sign-out and never read by the next person on the browser.
function useRecentResults({ enabled, getUserStorageKey, storageKey = 'search', maxCount = 4 }) {
  const key = getUserStorageKey(`lf-${storageKey}-recent-results`);
  const [recentResults, setRecentResults] = useState(() => (enabled ? readStored(key) : []));

  const addResult = useCallback(
    (item) => {
      if (!enabled || !item) return;
      setRecentResults((prev) => {
        const updated = addRecentResult(prev, item, maxCount);
        writeStored(key, updated);
        return updated;
      });
    },
    [enabled, key, maxCount]
  );

  return { recentResults: enabled ? recentResults.slice(0, maxCount) : [], addResult };
}

export default useRecentResults;
export { addRecentResult, readStored, toStoredResult, writeStored };
