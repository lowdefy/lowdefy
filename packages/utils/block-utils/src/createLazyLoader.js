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

// Memoizes success only. React.lazy caches a rejected promise forever, so on
// failure both the promise and the lazy component are dropped and the next
// mount retries instead of failing for the rest of the session.
function createLazyLoader({ load }) {
  let loadPromise = null;
  let loadedModule = null;
  let lazyImplementation = null;

  function preload() {
    if (loadPromise === null) {
      loadPromise = load().then(
        (module) => {
          loadedModule = module;
          return module;
        },
        (error) => {
          loadPromise = null;
          lazyImplementation = null;
          throw error;
        }
      );
    }
    return loadPromise;
  }

  // Returns the component to render and the promise it waits on. React 18
  // suspends a lazy component on its first render even when its promise has
  // already resolved, so a loaded module is rendered directly.
  function getImplementation() {
    if (loadedModule !== null) {
      return { Component: loadedModule.default, promise: loadPromise };
    }
    if (lazyImplementation === null) {
      const promise = preload();
      lazyImplementation = { Component: React.lazy(() => promise), promise };
    }
    return lazyImplementation;
  }

  return { getImplementation, preload };
}

export default createLazyLoader;
