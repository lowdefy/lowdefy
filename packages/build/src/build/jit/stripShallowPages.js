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

import PAGE_CONTENT_KEYS from './pageContentKeys.js';

// Strip shallow pages to stubs before schema validation.
// Stubs keep id + type (required by block schema) and ~shallow marker.
// Non-shallow pages (no skipped refs) keep their full content.
function stripShallowPages({ components, shallowPageIndices }) {
  (components.pages ?? []).forEach((page, i) => {
    if (!shallowPageIndices.has(i)) return;
    for (const key of PAGE_CONTENT_KEYS) {
      delete page[key];
    }
    page['~shallow'] = true;
  });
}

export default stripShallowPages;
