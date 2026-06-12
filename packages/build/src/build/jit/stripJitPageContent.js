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

import { type } from '@lowdefy/helpers';

import PAGE_CONTENT_KEYS from './pageContentKeys.js';

// Full S4 (E3): the compiled shallow build resolves the whole tree (factories
// are fast and the graph caches modules); the walker's shouldStop stripping
// becomes a post-resolution pass. Pages backed by a source file or a resolver
// (refMap path or original on their ~r entry) lose their content — JIT
// re-resolves them from source per visit, exactly as before. Inline pages
// (no ~r — defined in the root file) keep content for buildShallowPages.
// Runs BEFORE collectSkeletonSourceFiles so page files never classify as
// skeleton sources.
function stripJitPageContent({ components, context }) {
  for (const page of components.pages ?? []) {
    if (!type.isObject(page)) {
      continue;
    }
    const refId = page['~r'];
    if (refId === undefined) {
      continue;
    }
    const entry = context.refMap[refId];
    if (!entry) {
      continue;
    }
    if (entry.path == null && entry.original == null) {
      continue;
    }
    for (const key of PAGE_CONTENT_KEYS) {
      delete page[key];
    }
  }
  return components;
}

export default stripJitPageContent;
