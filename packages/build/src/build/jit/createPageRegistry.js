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
// When the child of root has no path (resolver refs), fall back to the closest
// descendant with a valid path so JIT can re-resolve from the template file.
//
// Resolver ref limitation: the resolver's own vars are discarded — only the
// template's vars are preserved. This works because the resolver already
// computed the vars to pass to the template during the skeleton build, so the
// template + its vars are self-sufficient. Trade-off: changes to resolver JS
// require a skeleton rebuild; JIT only picks up template/YAML edits.
function findPageSourceRef(refId, refMap, unresolvedRefVars) {
  let current = refId;
  let firstChildOfRoot = null;
  // Track the most recent entry with a valid path, walking up from the leaf.
  // Used as fallback when the child of root has no path (e.g., resolver refs).
  let lastWithPath = null;

  while (!type.isNone(current)) {
    const entry = refMap[current];
    if (!entry) {
      return null;
    }

    const hasVars = !type.isNone(unresolvedRefVars[current]);

    if (entry.path) {
      lastWithPath = {
        path: entry.path,
        unresolvedVars: unresolvedRefVars[current] ?? null,
      };
    }

    // Track the first child of root as fallback
    const parentEntry = !type.isNone(entry.parent) ? refMap[entry.parent] : null;
    if (parentEntry && type.isNone(parentEntry.parent) && !firstChildOfRoot) {
      // When the child of root has no path (resolver ref), fall back to the
      // closest descendant with a valid path. This allows JIT to re-resolve
      // resolver-generated pages from their template file with the correct vars.
      firstChildOfRoot = entry.path
        ? { path: entry.path, unresolvedVars: unresolvedRefVars[current] ?? null }
        : lastWithPath;
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
    const keyMapEntry = context.keyMap[page['~k']];
    const refId = keyMapEntry?.['~r'] ?? null;
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
