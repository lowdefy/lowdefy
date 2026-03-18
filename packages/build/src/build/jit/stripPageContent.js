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

function stripPageContent({ components, context }) {
  for (const page of components.pages ?? []) {
    // Only strip pages that have a source ref (will be JIT-rebuilt).
    // Inline pages (no ~r) must keep their content for buildShallowPages.
    const keyMapEntry = context.keyMap[page['~k']];
    const refId = keyMapEntry?.['~r'] ?? null;
    if (type.isNone(refId)) continue;

    for (const key of PAGE_CONTENT_KEYS) {
      delete page[key];
    }
  }
}

export default stripPageContent;
