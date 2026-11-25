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
import { resolveKeyEntry } from '@lowdefy/errors';

import makeId from '../../utils/makeId.js';
import findSourceRef from './findSourceRef.js';
import getModuleEntryId from './getModuleEntryId.js';
import normalizeRefPath from './normalizeRefPath.js';

// The source ref that owns a ref: the nearest ancestor-or-self that is an
// endpoint's source. Every ref a source's content reads descends from it, so a
// ref with no such ancestor was read by some other part of the config.
function createFindOwningSource({ refMap, sources }) {
  const owners = new Map();
  return function findOwningSource(refId) {
    const chain = [];
    let current = refId;
    let owner = null;
    while (!type.isNone(current)) {
      if (owners.has(current)) {
        owner = owners.get(current);
        break;
      }
      if (sources.has(current)) {
        owner = current;
        break;
      }
      chain.push(current);
      current = refMap[current]?.parent;
    }
    for (const id of chain) {
      owners.set(id, owner);
    }
    return owner;
  };
}

// What the dev server needs to rebuild one endpoint without rebuilding the
// config (buildEndpointsJit), from the config build that just ran: each
// endpoint's source file and the files it read, where it was keyed, and what
// its build reads from the rest of the config. Runs after the last addKeys,
// as createPageRegistry does.
//
// An endpoint has a source when it comes from a file of its own (or from a
// file that holds a list of endpoints and nothing else), as findSourceRef finds
// a page's. One written inline in lowdefy.yaml or a module manifest, or made
// by a resolver, has none: an edit that feeds it rebuilds the config.
//
// files are the files each endpoint's source read. A file is an endpoint file
// when every ref to it descends from an endpoint source; a file another part
// of the config also reads is in otherFiles, and an edit to it rebuilds the
// config.
function createEndpointRegistry({ components, context, pageIds, skeletonSourceFiles }) {
  const { keyMap, refMap } = context;
  const unresolvedRefVars = context.unresolvedRefVars ?? {};
  const api = components.api ?? [];

  const apiKey = api['~k'] ?? null;
  const apiRef = type.isNone(apiKey)
    ? null
    : (resolveKeyEntry({ keyMap, configKey: apiKey })?.refId ?? null);

  const endpoints = new Map();
  const sources = new Map();
  for (const endpoint of api) {
    const rootKey = endpoint['~k'];
    const refId = resolveKeyEntry({ keyMap, configKey: rootKey })?.refId ?? null;
    const sourceRef = type.isNone(refId)
      ? null
      : findSourceRef({ refId, refMap, unresolvedRefVars });
    // A resolver's output depends on whatever its code reads, which no ref
    // records. ~ignoreBuildChecks on the root may come from the _ref that
    // holds the source (the walker copies it onto the content), which a
    // source resolved on its own does not see.
    const source =
      type.isNone(sourceRef) || type.isNone(sourceRef.path) || !type.isUndefined(keyMap[rootKey]?.i)
        ? null
        : {
            refId: sourceRef.refId,
            refPath: sourceRef.path,
            unresolvedVars: sourceRef.unresolvedVars,
            transformer: sourceRef.transformer,
            moduleEntryId: getModuleEntryId(endpoint.endpointId, context),
          };
    if (!type.isNone(source)) {
      if (!sources.has(source.refId)) {
        sources.set(source.refId, []);
      }
      sources.get(source.refId).push(endpoint.endpointId);
    }
    endpoints.set(endpoint.endpointId, {
      endpointId: endpoint.endpointId,
      rootKey,
      segment: keyMap[rootKey]?.s ?? null,
      source,
      files: new Set(),
    });
  }

  // A source whose content holds another endpoint's source (a list of inline
  // endpoints and refs) can drop that endpoint without its own endpoints
  // changing, so an edit to it rebuilds the config.
  for (const sourceRefId of [...sources.keys()]) {
    let current = refMap[sourceRefId]?.parent;
    while (!type.isNone(current)) {
      if (sources.has(current)) {
        for (const endpointId of sources.get(current)) {
          endpoints.get(endpointId).source = null;
        }
        sources.delete(current);
      }
      current = refMap[current]?.parent;
    }
  }

  const findOwningSource = createFindOwningSource({ refMap, sources });
  const filesBySource = new Map();
  const otherFiles = new Set();
  for (const [refId, entry] of Object.entries(refMap)) {
    if (!type.isString(entry.path)) continue;
    const file = normalizeRefPath(entry.path);
    const owner = findOwningSource(refId);
    if (type.isNone(owner)) {
      otherFiles.add(file);
      continue;
    }
    if (!filesBySource.has(owner)) {
      filesBySource.set(owner, new Set());
    }
    filesBySource.get(owner).add(file);
  }
  for (const [sourceRefId, endpointIds] of sources) {
    const files = filesBySource.get(sourceRefId) ?? new Set();
    for (const endpointId of endpointIds) {
      endpoints.get(endpointId).files = new Set(files);
    }
  }

  // Files only endpoints read; an edit to one rebuilds just those endpoints.
  const endpointOnlyFiles = new Set();
  for (const files of filesBySource.values()) {
    for (const file of files) {
      if (!otherFiles.has(file)) {
        endpointOnlyFiles.add(file);
      }
    }
  }

  return {
    // The api array's key and the ref it resolves to: a rebuilt endpoint is
    // keyed under it (addKeys parent).
    apiKey,
    apiRef,
    endpoints,
    // The config build's key prefix: rebuilt endpoints key on from it.
    keyPrefix: makeId.prefix,
    otherFiles,
    // The skeleton source files no endpoint reads alone: skeletonSourceFiles.json
    // is these and every endpoint's files.
    otherSkeletonFiles: new Set(
      [...skeletonSourceFiles].filter((file) => !endpointOnlyFiles.has(file))
    ),
    // What an endpoint's build reads from the rest of the config.
    agents: (components.agents ?? []).map((agent) => ({
      agentId: agent.agentId,
      tools: (agent.tools ?? []).map((tool) => ({ confirm: tool.confirm })),
    })),
    environments: components.config?.environments,
    pageIds,
    // The config build's warnings, by the endpoint they were found in
    // (attributeEndpointWarnings).
    warnings: { byEndpoint: new Map(), other: [] },
    // Counts the endpoint builds since this config build, naming their maps files.
    builds: 0,
  };
}

export default createEndpointRegistry;
