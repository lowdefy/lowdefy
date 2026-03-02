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

// Walk up from ~r to find the page's source file for JIT re-resolution.
// Templates receive vars (they need id, title, etc. from the page file),
// while page files are self-contained or receive vars from a collection file.
// Stop at the first ref called WITHOUT vars — that's the page file.
// When ALL refs have vars (module pages), fall back to the first child of root.
function findPageSourceRef(refId, refMap, unresolvedRefVars) {
  let current = refId;
  let firstChildOfRoot = null;

  while (!type.isNone(current)) {
    const entry = refMap[current];
    if (!entry) return null;

    const hasVars = !type.isNone(unresolvedRefVars[current]);

    // Track the first child of root as fallback
    const parentEntry = !type.isNone(entry.parent) ? refMap[entry.parent] : null;
    if (parentEntry && type.isNone(parentEntry.parent) && !firstChildOfRoot) {
      firstChildOfRoot = {
        path: entry.path,
        unresolvedVars: unresolvedRefVars[current] ?? null,
      };
    }

    // First ref without vars = self-contained page file
    if (!hasVars) {
      if (!type.isNone(entry.parent)) {
        return { path: entry.path, unresolvedVars: null };
      }
      // Reached root — use first child of root
      return firstChildOfRoot;
    }

    current = entry.parent;
  }
  return firstChildOfRoot;
}

function createPageRegistry({ components, context }) {
  const registry = new Map();
  const unresolvedRefVars = context.unresolvedRefVars ?? {};

  (components.pages ?? []).forEach((page) => {
    // Read ~r from keyMap — addKeys moves ~r there and deletes it from objects.
    const refId = context.keyMap[page['~k']]?.['~r'] ?? null;
    const sourceRef = !type.isNone(refId)
      ? findPageSourceRef(refId, context.refMap, unresolvedRefVars)
      : null;
    registry.set(page.id, {
      pageId: page.id,
      auth: page.auth,
      refId,
      refPath: sourceRef?.path ?? null,
      unresolvedVars: sourceRef?.unresolvedVars ?? null,
    });
  });

  return registry;
}

export default createPageRegistry;
