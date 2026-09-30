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

import path from 'node:path';
import { ConfigError, resolveConfigLocation } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

import buildPageIfNeeded from '../server/jitPageBuilder.js';
import getHazards from './getHazards.js';
import readBuildArtifact from './readBuildArtifact.js';

const MAX_MATCHES = 20;

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Array segments in keyMap `key` paths look like `[0:home]` or
// `[2:my_button:Button]` (see packages/build/src/build/addKeys.js recArray) —
// match an id at either position.
function buildIdPattern(id) {
  return new RegExp(`\\[\\d+:${escapeRegExp(id)}(:[^\\]]*)?\\]`);
}

// The JIT page build runs addKeys on the page object itself (see
// packages/build/src/build/jit/buildPageJit.js), so a built page's keyMap
// subtree is keyed `root`, `root.blocks[...]` — the key path carries NO page
// segment, and every built page looks identical by prefix. The page a keyMap
// entry belongs to is only recoverable structurally: walk ~k_parent up to the
// subtree root and compare against the page's own root. The page's root is
// found from its build artifact — block objects in pages/<pageId>.json keep
// their ~k, and any of them chains up to the page root. Skeleton-style keys
// (`root.pages[N:pageId]...`) carry the page segment inline, so a containment
// pattern covers those.
function buildPageScope({ pageId, keyMap }) {
  // A page built during the skeleton build (e.g. the default 404 page) has
  // no JIT root at all — its keys carry the page segment inline, so the
  // pattern branch identifies them instead.
  return {
    rootKeyId: findPageRootKeyId({ pageId, keyMap }),
    pagePattern: new RegExp(`\\bpages\\[\\d+:${escapeRegExp(pageId)}(:[^\\]]*)?\\]`),
  };
}

function findGlobalRootId(keyMap) {
  for (const [keyId, entry] of Object.entries(keyMap)) {
    if (entry?.key === 'root.pages') {
      return resolveChainRootId({ keyId, keyMap });
    }
  }
  return null;
}

// A built page artifact mixes keys from two trees: the skeleton build keys
// the page stub (its `auth`, for one), chaining to the global config root,
// while the JIT build keys the page content under its own root. Only the
// JIT root discriminates pages, so skip keys that chain to the global root.
function findPageRootKeyId({ pageId, keyMap }) {
  const artifact = readBuildArtifact({ name: `pages/${pageId}.json`, deserialize: true });
  const globalRootId = findGlobalRootId(keyMap);
  for (const keyId of collectKeyIds(artifact)) {
    const rootKeyId = resolveChainRootId({ keyId, keyMap });
    if (rootKeyId !== globalRootId) {
      return rootKeyId;
    }
  }
  return null;
}

function collectKeyIds(node, keyIds = []) {
  if (type.isString(node?.['~k'])) {
    keyIds.push(node['~k']);
  }
  if (type.isArray(node)) {
    node.forEach((item) => collectKeyIds(item, keyIds));
  } else if (type.isObject(node)) {
    Object.keys(node).forEach((key) => collectKeyIds(node[key], keyIds));
  }
  return keyIds;
}

// Walk ~k_parent to the top of the entry's subtree. addKeys assigns the tree
// root a parent id that is never written to keyMap, so "parent not in keyMap"
// is the root. The seen-set guards against a corrupt artifact cycling forever.
function resolveChainRootId({ keyId, keyMap }) {
  let currentId = keyId;
  const seen = new Set();
  while (!seen.has(currentId)) {
    seen.add(currentId);
    const parentId = keyMap[currentId]?.['~k_parent'];
    if (type.isNone(parentId) || type.isUndefined(keyMap[parentId])) {
      return currentId;
    }
    currentId = parentId;
  }
  return currentId;
}

function belongsToPage({ keyId, entry, keyMap, pageScope }) {
  if (pageScope.pagePattern.test(entry.key)) {
    return true;
  }
  if (type.isNone(pageScope.rootKeyId)) {
    return false;
  }
  return resolveChainRootId({ keyId, keyMap }) === pageScope.rootKeyId;
}

// A key path ends in the matched node's own segment, `blocks[2:my_button:Button]`
// (addKeys recArray writes `name[index:id:type]`), which is all the kind and
// type information hazards need.
const NODE_SEGMENT = /([A-Za-z_]+)\[\d+:([^\]:]+)(?::([^\]]*))?\]$/;
const SEGMENT_KINDS = {
  blocks: 'blocks',
  connections: 'connections',
  pages: 'pages',
  requests: 'requests',
};

// writeRequests strips connectionId off the page's requests array after
// writing the per-request artifact, so a request's connection is only
// readable there. Without a pageId the match's page is not known, so the
// registry's pages are tried in turn — a requestId is unique within a page.
function findRequestConnectionId({ requestId, requestPageIds }) {
  for (const pageId of requestPageIds) {
    const request = readBuildArtifact({ name: `pages/${pageId}/requests/${requestId}.json` });
    if (!type.isNone(request)) {
      return request.connectionId ?? null;
    }
  }
  return null;
}

function hazardsForMatch({ keyPath, requestPageIds }) {
  const segment = NODE_SEGMENT.exec(keyPath);
  if (type.isNone(segment)) {
    return [];
  }
  const [, arrayName, id, nodeType] = segment;
  const kind = SEGMENT_KINDS[arrayName] ?? null;
  let connectionId = null;
  if (kind === 'requests') {
    connectionId = findRequestConnectionId({ requestId: id, requestPageIds });
  }
  return getHazards({ kind, type: nodeType ?? null, connectionId });
}

function scanKeyMap({ id, keyMap, refMap, configDirectory, pageScope, requestPageIds }) {
  const pattern = buildIdPattern(id);
  const matches = [];
  for (const [keyId, entry] of Object.entries(keyMap)) {
    if (matches.length >= MAX_MATCHES) {
      break;
    }
    if (!type.isString(entry?.key)) {
      continue;
    }
    if (!pattern.test(entry.key)) {
      continue;
    }
    if (pageScope && !belongsToPage({ keyId, entry, keyMap, pageScope })) {
      continue;
    }
    matches.push({
      keyPath: entry.key,
      location: resolveConfigLocation({ configKey: keyId, keyMap, refMap, configDirectory }),
      hazards: hazardsForMatch({ keyPath: entry.key, requestPageIds }),
    });
  }
  return matches;
}

// List item blocks render with array indices applied to their ids
// (`my_list.0.name`) while config — and therefore keyMap — holds the `$`
// placeholder form (`my_list.$.name`, see applyArrayIndices in
// @lowdefy/helpers). Fold numeric segments back to `$` so a runtime id from
// inside a list resolves to the yaml that defines the item block instead of
// missing and falling back to an ancestor (usually the list itself).
function deIndexId(id) {
  return id.replace(/\.\d+(?=\.|$)/g, () => '.$');
}

function scanKeyMapWithDeIndex({ id, keyMap, refMap, configDirectory, pageScope, requestPageIds }) {
  const matches = scanKeyMap({ id, keyMap, refMap, configDirectory, pageScope, requestPageIds });
  if (matches.length > 0) {
    return matches;
  }
  const deIndexedId = deIndexId(id);
  if (deIndexedId === id) {
    return matches;
  }
  return scanKeyMap({
    id: deIndexedId,
    keyMap,
    refMap,
    configDirectory,
    pageScope,
    requestPageIds,
  });
}

// Locates a block/request/connection/etc by id, or a page by pageId. Block
// content only exists in keyMap once its page has been JIT-built (see
// lib/server/jitPageBuilder.js), so pass `pageId` to force-build and scan a
// specific page. Never throws on not-found — agents should be able to treat
// "no matches" as a normal result and try another id or pageId.
async function findConfig({ id, pageId }) {
  if (type.isNone(id) || !type.isString(id)) {
    throw new ConfigError(
      `findConfig requires an "id" string. Received ${JSON.stringify(id)}. ` +
        'Use GET /lowdefy-docs/find/:id.'
    );
  }

  const pageRegistry = readBuildArtifact({ name: 'pageRegistry.json' }) ?? {};
  const configDirectory = process.env.LOWDEFY_DIRECTORY_CONFIG || process.cwd();

  // A page's root block renders with blockId === pageId, so open-in-editor
  // and feedback enrichment hit this branch for it — they read
  // matches[0].location.source, so the page result must carry a match, not
  // just the file field the docs/MCP consumers use.
  if (pageRegistry[id]) {
    const refPath = pageRegistry[id].refPath;
    const matches = [];
    if (type.isString(refPath)) {
      matches.push({
        keyPath: `pages[${id}]`,
        location: { source: path.resolve(configDirectory, refPath) },
        hazards: getHazards({ kind: 'pages' }),
      });
    }
    return { kind: 'page', pageId: id, file: refPath, matches };
  }

  if (!type.isNone(pageId)) {
    if (!pageRegistry[pageId]) {
      return {
        matches: [],
        note:
          `Unknown pageId "${pageId}". See GET /lowdefy-docs/find/${id} without ?pageId= ` +
          'to scan all already-built pages, or check the pageId spelling.',
      };
    }

    const buildDirectory = path.join(process.cwd(), 'build');
    try {
      await buildPageIfNeeded({ pageId, buildDirectory, configDirectory });
    } catch (error) {
      return {
        matches: [],
        note: `Page "${pageId}" failed to build, so its config could not be scanned: ${error.message}`,
      };
    }

    const keyMap = readBuildArtifact({ name: 'keyMap.json' }) ?? {};
    const refMap = readBuildArtifact({ name: 'refMap.json' }) ?? {};
    const matches = scanKeyMapWithDeIndex({
      id,
      keyMap,
      refMap,
      configDirectory,
      pageScope: buildPageScope({ pageId, keyMap }),
      requestPageIds: [pageId],
    });
    return matches.length > 0
      ? { matches }
      : {
          matches,
          note:
            `No config found with id "${id}" on page "${pageId}". Retry without ?pageId= to ` +
            'scan all built pages and app-level config (connections, menus, api).',
        };
  }

  const keyMap = readBuildArtifact({ name: 'keyMap.json' }) ?? {};
  const refMap = readBuildArtifact({ name: 'refMap.json' }) ?? {};
  const matches = scanKeyMapWithDeIndex({
    id,
    keyMap,
    refMap,
    configDirectory,
    requestPageIds: Object.keys(pageRegistry),
  });
  return {
    matches,
    note:
      'Scanned without a pageId — content on pages that have not been JIT-built yet is not ' +
      'in keyMap and was not covered. Pass ?pageId= to force-build and scan a specific page.',
  };
}

export default findConfig;
