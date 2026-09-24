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

import collectChunkClosure from './collectChunkClosure.js';
import collectLazyImports from './collectLazyImports.js';

const PAGE_TYPES_PREFIX = 'build/plugins/pageTypes/';
const ICONS_KEY = 'build/plugins/icons.js';

// Preloads per page types key: the key's chunk, the app-wide icons chunk, and
// their imports, less what the main entry already loads. Prefetches: the lazy
// block implementations the key's chunks import on mount, with their imports,
// less anything already preloaded or in the main entry. Prefetch is low
// priority, so a lazy block that mounts at first paint finds its code in the
// cache without delaying the page's own chunks.
function collectPageTypesAssets({ manifest, entryFiles }) {
  const pageTypes = {};
  Object.keys(manifest)
    .filter((key) => key.startsWith(PAGE_TYPES_PREFIX))
    .forEach((key) => {
      const typesKey = key.slice(PAGE_TYPES_PREFIX.length).replace(/\.js$/, '');
      const js = new Set();
      const css = new Set();
      collectChunkClosure({ manifest, key, js, css });
      collectChunkClosure({ manifest, key: ICONS_KEY, js, css });

      const lazyKeys = new Set();
      collectLazyImports({ manifest, key, entryFiles, visited: new Set(), lazyKeys });
      const prefetchJs = new Set();
      const prefetchCss = new Set();
      lazyKeys.forEach((lazyKey) =>
        collectChunkClosure({ manifest, key: lazyKey, js: prefetchJs, css: prefetchCss })
      );

      pageTypes[typesKey] = {
        js: [...js].filter((file) => !entryFiles.has(file)),
        css: [...css].filter((file) => !entryFiles.has(file)),
        prefetch: [...prefetchJs, ...prefetchCss].filter(
          (file) => !entryFiles.has(file) && !js.has(file) && !css.has(file)
        ),
      };
    });
  return pageTypes;
}

export default collectPageTypesAssets;
