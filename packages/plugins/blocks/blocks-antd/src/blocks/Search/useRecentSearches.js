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

function getStorageKey(storageKey) {
  return `lf-${storageKey}-recent`;
}

function readFromStorage(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeToStorage(key, items) {
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch {
    // localStorage unavailable
  }
}

function useRecentSearches({ enabled, storageKey = 'search', maxCount = 5 }) {
  const key = getStorageKey(storageKey);
  const [recentSearches, setRecentSearches] = useState(() => {
    if (!enabled) return [];
    return readFromStorage(key);
  });

  const addSearch = useCallback(
    (query) => {
      if (!enabled || !query) return;
      setRecentSearches((prev) => {
        const filtered = prev.filter((item) => item.query !== query);
        const updated = [{ query, timestamp: Date.now() }, ...filtered].slice(0, maxCount);
        writeToStorage(key, updated);
        return updated;
      });
    },
    [enabled, key, maxCount]
  );

  const clearSearches = useCallback(() => {
    if (!enabled) return;
    setRecentSearches([]);
    try {
      localStorage.removeItem(key);
    } catch {
      // localStorage unavailable
    }
  }, [enabled, key]);

  return { recentSearches, addSearch, clearSearches };
}

export default useRecentSearches;
