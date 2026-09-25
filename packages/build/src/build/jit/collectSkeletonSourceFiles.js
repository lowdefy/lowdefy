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

// Walk an object/array tree collecting non-enumerable ~r ref IDs.
// ~r is set by buildRefs (walker.js) on every resolved object/array
// and is non-enumerable, so Object.keys() won't find it.
function walkRefIds(obj, refIds) {
  if (obj === null || typeof obj !== 'object') return;

  if (obj['~r'] !== undefined) {
    refIds.add(obj['~r']);
  }

  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      walkRefIds(obj[i], refIds);
    }
  } else {
    for (const key of Object.keys(obj)) {
      walkRefIds(obj[key], refIds);
    }
  }
}

// The refs of the files that hold a pages list: the app's pages (when
// lowdefy.yaml has pages: { _ref: pages.yaml }) and each module's pages.
function collectPagesListRefIds({ components, context }) {
  const pagesLists = [
    components.pages,
    ...Object.values(context.modules ?? {}).map((moduleEntry) => moduleEntry.manifest?.pages),
  ];
  const listRefIds = new Set();
  for (const pagesList of pagesLists) {
    if (pagesList?.['~r'] !== undefined) {
      listRefIds.add(pagesList['~r']);
    }
  }
  return listRefIds;
}

// The refs between a page and the list that holds it: the page file and any
// template it refs (a page file whose content is a _ref to a template with
// vars carries no ~r marker of its own).
function collectPageFileRefIds({ page, listRefIds, refMap, pageRefIds }) {
  let current = page['~r'];
  while (current != null && !listRefIds.has(current)) {
    const entry = refMap[current];
    if (!entry || entry.parent == null) return;
    pageRefIds.add(current);
    current = entry.parent;
  }
}

// Collect file paths that contribute to skeleton (non-page) config.
// Walks ~r markers on non-page components, traces each through the
// refMap parent chain, and scans for scalar-resolving descendants.
function collectSkeletonSourceFiles({ components, context }) {
  const refIds = new Set();

  for (const key of Object.keys(components)) {
    if (key === 'pages') continue;
    walkRefIds(components[key], refIds);
  }

  // Module consumerVars contribute to skeleton state via modules.json.
  // Their ~r markers may only appear under pages (when consumed via
  // _module.var inside page-referenced components), so the non-page
  // walk above can miss them. Walk here so changes to per-app module
  // vars files trigger a skeleton rebuild.
  for (const moduleEntry of Object.values(context.modules ?? {})) {
    walkRefIds(moduleEntry.consumerVars, refIds);
  }

  // A file that holds a pages list decides which pages exist, so it shapes the
  // page registry: adding a page to it needs a skeleton rebuild. The page
  // files it references stay page content.
  const listRefIds = collectPagesListRefIds({ components, context });
  for (const listRefId of listRefIds) {
    refIds.add(listRefId);
  }

  // The walker only ~r-tags resolved _ref content, never the root file's own
  // objects — so a scalar ref parented directly on the root (e.g.
  // app.html.appendHead: {_ref: head.html}) has no collected ancestor and
  // would be missed by the descendant scan. Add the root ref id explicitly.
  if (context.rootRefDef?.id != null) {
    refIds.add(context.rootRefDef.id);
  }

  // Page refs are stop boundaries for the descendant scan: with the root id
  // collected, a scalar ref'd inside a page file would otherwise reach the
  // root through its page ref and wrongly become a skeleton source.
  const pageRefIds = new Set();
  for (const page of components.pages ?? []) {
    walkRefIds(page, pageRefIds);
    collectPageFileRefIds({ page, listRefIds, refMap: context.refMap, pageRefIds });
  }

  const sourceFiles = new Set();

  // Walk parent chains for each collected ref ID
  for (const refId of refIds) {
    let current = refId;
    while (current != null) {
      const entry = context.refMap[current];
      if (!entry) break;
      if (entry.path) {
        sourceFiles.add(entry.path);
      }
      current = entry.parent;
    }
  }

  // Scan for scalar-resolving descendants: refs that resolved to primitives
  // have no ~r marker in the tree but are recorded in the refMap. Include
  // their paths if any ancestor in their parent chain is a collected ref ID.
  for (const [id, entry] of Object.entries(context.refMap)) {
    if (refIds.has(id)) continue;
    if (pageRefIds.has(id)) continue;
    let current = entry.parent;
    while (current != null) {
      if (refIds.has(current)) {
        if (entry.path) {
          sourceFiles.add(entry.path);
        }
        break;
      }
      if (pageRefIds.has(current)) break;
      const parentEntry = context.refMap[current];
      if (!parentEntry) break;
      current = parentEntry.parent;
    }
  }

  return sourceFiles;
}

export default collectSkeletonSourceFiles;
