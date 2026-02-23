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

function containsShallowMarker(value) {
  if (value == null || typeof value !== 'object') return false;
  if (value['~shallow'] === true) return true;
  return Object.values(value).some(containsShallowMarker);
}

function findShallowPageIndices(pages) {
  const indices = new Set();
  (pages ?? []).forEach((page, i) => {
    for (const key of PAGE_CONTENT_KEYS) {
      if (containsShallowMarker(page[key])) {
        indices.add(i);
        break;
      }
    }
  });
  return indices;
}

export default findShallowPageIndices;
