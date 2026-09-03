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

import collectConfigKeyEntries from './collectConfigKeyEntries.js';
import readBuildArtifact from './readBuildArtifact.js';

function addChanged({ configKey, blockId, changedFiles, resolveConfigFile, found, ids }) {
  const file = resolveConfigFile(configKey);
  if (type.isNone(file) || !changedFiles.has(file)) {
    return false;
  }
  found.files.add(file);
  if (!type.isNone(blockId)) {
    found.blocks.add(blockId);
  }
  if (!type.isNone(ids)) {
    ids.forEach(({ set, id }) => set.add(id));
  }
  return true;
}

// Which of the changed files this page is made of, and what they define. A page
// counts as changed when a key of the page itself, one of its requests, or an
// endpoint it calls resolves to a changed file — a request or endpoint edited
// in a file the page never mentions still changes what the page does.
function getPageChanges({
  pageId,
  page,
  registryEntry,
  endpointIds,
  changedFiles,
  resolveConfigFile,
}) {
  const found = {
    files: new Set(),
    blocks: new Set(),
    requests: new Set(),
    endpoints: new Set(),
  };

  // A page whose artifact is not built yet has no keys at all; its registered
  // source file is still knowable.
  if (changedFiles.has(registryEntry?.refPath)) {
    found.files.add(registryEntry.refPath);
  }

  collectConfigKeyEntries({ node: page ?? {} }).forEach(({ blockId, configKey }) => {
    addChanged({ configKey, blockId, changedFiles, resolveConfigFile, found });
  });

  (page?.requests ?? []).forEach(({ requestId }) => {
    const request = readBuildArtifact({
      name: `pages/${pageId}/requests/${requestId}.json`,
      deserialize: true,
    });
    addChanged({
      configKey: request?.['~k'],
      blockId: null,
      changedFiles,
      resolveConfigFile,
      found,
      ids: [{ set: found.requests, id: requestId }],
    });
  });

  endpointIds.forEach((endpointId) => {
    const endpoint = readBuildArtifact({ name: `api/${endpointId}.json`, deserialize: true });
    collectConfigKeyEntries({ node: endpoint ?? {} }).forEach(({ configKey }) => {
      addChanged({
        configKey,
        blockId: null,
        changedFiles,
        resolveConfigFile,
        found,
        ids: [{ set: found.endpoints, id: endpointId }],
      });
    });
  });

  return {
    changed: found.files.size > 0,
    files: [...found.files].sort(),
    blocks: [...found.blocks].sort(),
    requests: [...found.requests].sort(),
    endpoints: [...found.endpoints].sort(),
  };
}

export default getPageChanges;
