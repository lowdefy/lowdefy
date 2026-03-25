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
// When the child of root has no path (resolver ref), go shallower — capture
// the resolver's info so JIT can re-run it with freshly resolved vars.
function findPageSourceRef(refId, refMap, unresolvedRefVars) {
  let current = refId;
  let firstChildOfRoot = null;

  while (!type.isNone(current)) {
    const entry = refMap[current];
    if (!entry) {
      return null;
    }

    const hasVars = !type.isNone(unresolvedRefVars[current]);

    // Track the first child of root as fallback
    const parentEntry = !type.isNone(entry.parent) ? refMap[entry.parent] : null;
    if (parentEntry && type.isNone(parentEntry.parent) && !firstChildOfRoot) {
      // Resolver ref: capture the resolver's original definition and vars
      // so JIT can re-run the resolver (instead of falling through to the
      // template file below it, which would discard the resolver's vars).
      firstChildOfRoot = entry.path
        ? { path: entry.path, unresolvedVars: unresolvedRefVars[current] ?? null }
        : { path: null, original: refMap[current].original };
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

function getModuleEntryId(pageId, context) {
  for (const entryId of Object.keys(context.modules ?? {})) {
    if (pageId.startsWith(`${entryId}/`)) {
      return entryId;
    }
  }
  return null;
}

// For module pages where findPageSourceRef fails (the ~r marker is lost
// during buildModules spread), find the page's source file by searching
// the refMap for a ref whose path is inside the module's root directory
// and whose filename matches a page YAML convention.
function findModulePageRefPath(pageId, moduleEntryId, context) {
  const moduleEntry = context.modules[moduleEntryId];
  if (!moduleEntry?.moduleRoot) return null;

  const unscopedId = pageId.slice(`${moduleEntryId}/`.length);

  // Search refMap for a ref whose path is inside the module root
  // and contains the unscoped page id in the filename
  for (const [refId, entry] of Object.entries(context.refMap)) {
    if (!entry.path) continue;
    if (!entry.path.startsWith(moduleEntry.moduleRoot)) continue;
    // Match page YAML files (e.g., pages/contacts.yaml, pages/contact-detail.yaml)
    if (entry.path.endsWith(`/${unscopedId}.yaml`) || entry.path.endsWith(`/${unscopedId}.yml`)) {
      return { refId, path: entry.path };
    }
  }
  return null;
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

    // Inline pages (defined directly in lowdefy.yaml) have a refId pointing to
    // the root ref but findPageSourceRef returns null because there is no
    // separate source file. Set refId to null so buildPageJit serves them from
    // the pre-built artifact written by buildShallowPages.
    const isInline =
      !type.isNone(refId) &&
      sourceRef === null &&
      !type.isNone(context.refMap[refId]) &&
      type.isNone(context.refMap[refId].parent);

    const moduleEntryId = getModuleEntryId(page.id, context);

    // For module pages where ~r was lost during buildModules (object spread
    // drops non-enumerable markers), recover the source file from refMap.
    let finalRefId = isInline ? null : refId;
    let finalRefPath = sourceRef?.path ?? null;
    if (!finalRefPath && moduleEntryId) {
      const recovered = findModulePageRefPath(page.id, moduleEntryId, context);
      if (recovered) {
        finalRefId = finalRefId ?? recovered.refId;
        finalRefPath = recovered.path;
      }
    }

    registry.set(page.id, {
      pageId: page.id,
      auth: page.auth,
      refId: finalRefId,
      refPath: finalRefPath,
      unresolvedVars: sourceRef?.unresolvedVars ?? null,
      resolverOriginal: sourceRef?.original ?? null,
      moduleEntryId,
    });
  });

  return registry;
}

export default createPageRegistry;
