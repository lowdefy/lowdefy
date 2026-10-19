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

import { useState, useCallback, useRef, useEffect } from 'react';
import { type } from '@lowdefy/helpers';
import MiniSearch from 'minisearch';

const indexCache = new Map();

function useSearchIndex({ indexUrl, documents, fields, storeFields, searchOptions }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Incremented whenever an index (re)builds, so an open modal can re-run its
  // current query against the fresh index instead of waiting for a reopen.
  const [version, setVersion] = useState(0);
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
        setVersion((v) => v + 1);
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
    setVersion((v) => v + 1);
  }, [documents, fields, storeFields]);

  // Documents typically arrive async (e.g. bound to a request result). Rebuild
  // whenever the array reference changes so an already-open modal picks up data
  // that resolved after ensureLoaded ran.
  useEffect(() => {
    if (documents && documentsRef.current !== documents) {
      buildFromDocuments();
    }
  }, [documents, buildFromDocuments]);

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

  // Documents mode with the data still in flight (e.g. a request that has not
  // resolved yet evaluates to null/undefined): report loading so the modal can
  // show a spinner instead of a false "No results found."
  const waitingForDocuments = type.isNone(indexUrl) && type.isNone(documents) && !loadedRef.current;

  return {
    search,
    loading: loading || waitingForDocuments,
    error,
    ensureLoaded,
    version,
    searchDefaults: indexMetaRef.current.searchDefaults,
    resultDefaults: indexMetaRef.current.resultDefaults,
    groups: indexMetaRef.current.groups,
  };
}

export default useSearchIndex;
