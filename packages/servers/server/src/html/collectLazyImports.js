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

const LAZY_SUFFIX = '.lazy.js';

// The lazy block implementations a chunk's static closure imports dynamically.
// Only modules named *.lazy.js count: other import()s, such as an SDK loaded
// only when a feature is switched on, exist so they are not downloaded. The
// main entry's closure is not walked, since its dynamic imports are the page
// types chunks and app-wide optional code, never one page's lazy blocks.
function collectLazyImports({ manifest, key, entryFiles, visited, lazyKeys }) {
  if (visited.has(key)) {
    return;
  }
  visited.add(key);
  const chunk = manifest[key];
  if (entryFiles.has(chunk.file)) {
    return;
  }
  (chunk.dynamicImports ?? [])
    .filter((importKey) => importKey.endsWith(LAZY_SUFFIX))
    .forEach((importKey) => lazyKeys.add(importKey));
  (chunk.imports ?? []).forEach((importKey) =>
    collectLazyImports({ manifest, key: importKey, entryFiles, visited, lazyKeys })
  );
}

export default collectLazyImports;
