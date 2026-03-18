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

import { useState, useCallback, useRef } from 'react';
import MiniSearch from 'minisearch';

const indexCache = new Map();

function useSearchIndex({ indexUrl, documents, fields, storeFields, searchOptions }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const indexMetaRef = useRef({
    searchDefaults: {},
    resultDefaults: {},
    groups: [],
  });
  const instancesRef = useRef([]);
  const loadedRef = useRef(false);
  const documentsRef = useRef(null);

  const loadIndexes = useCallback(async () => {
    if (indexUrl) {
      const urls = Array.isArray(indexUrl) ? indexUrl : [indexUrl];
      const uncached = urls.filter((url) => !indexCache.has(url));

      if (uncached.length === 0) {
        instancesRef.current = urls.map((url) => indexCache.get(url).instance);
        const first = indexCache.get(urls[0]);
        indexMetaRef.current = {
          searchDefaults: first.searchDefaults ?? {},
          resultDefaults: first.resultDefaults ?? {},
          groups: first.groups ?? [],
        };
        loadedRef.current = true;
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const results = await Promise.all(
          uncached.map(async (url) => {
            const response = await fetch(url);
            if (!response.ok) {
              throw new Error(`Failed to fetch index: ${url} (${response.status})`);
            }
            return { url, json: await response.json() };
          })
        );

        for (const { url, json } of results) {
          const instance = await MiniSearch.loadJSONAsync(JSON.stringify(json.data), json.options);
          indexCache.set(url, {
            instance,
            searchDefaults: json.searchDefaults,
            resultDefaults: json.resultDefaults,
            groups: json.groups,
          });
        }

        instancesRef.current = urls.map((url) => indexCache.get(url).instance);
        const first = indexCache.get(urls[0]);
        indexMetaRef.current = {
          searchDefaults: first.searchDefaults ?? {},
          resultDefaults: first.resultDefaults ?? {},
          groups: first.groups ?? [],
        };
        loadedRef.current = true;
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }
  }, [indexUrl]);

  const buildFromDocuments = useCallback(() => {
    if (!documents || documentsRef.current === documents) return;
    documentsRef.current = documents;
    const instance = new MiniSearch({
      fields: fields ?? ['title', 'content'],
      storeFields: storeFields ?? [],
    });
    instance.addAll(documents);
    instancesRef.current = [instance];
    loadedRef.current = true;
  }, [documents, fields, storeFields]);

  const ensureLoaded = useCallback(async () => {
    if (loadedRef.current && !documents) return;
    if (documents) {
      buildFromDocuments();
    } else if (indexUrl) {
      await loadIndexes();
    }
  }, [documents, indexUrl, loadIndexes, buildFromDocuments]);

  const search = useCallback(
    (query) => {
      if (!loadedRef.current || !query) return [];
      const mergedOptions = {
        ...indexMetaRef.current.searchDefaults,
        ...searchOptions,
      };
      const allResults = [];
      for (const instance of instancesRef.current) {
        const results = instance.search(query, mergedOptions);
        allResults.push(...results);
      }
      allResults.sort((a, b) => b.score - a.score);
      return allResults;
    },
    [searchOptions]
  );

  return {
    search,
    loading,
    error,
    ensureLoaded,
    searchDefaults: indexMetaRef.current.searchDefaults,
    resultDefaults: indexMetaRef.current.resultDefaults,
    groups: indexMetaRef.current.groups,
  };
}

export default useSearchIndex;
