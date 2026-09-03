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

// getDataModel's edges point collection -> readers/writers. A brief needs the
// inverse (page -> collections, endpoint -> collections), so the same edges are
// read back the other way round rather than reclassifying anything: the
// checkRead/checkWrite meta and the pipeline scan stay in getDataModel, which
// owns them.
function ownerOf({ entry, index }) {
  if (entry.kind === 'request' && type.isString(entry.pageId)) {
    return { scope: index.pages, id: entry.pageId };
  }
  if (entry.kind === 'step' && type.isString(entry.endpointId)) {
    return { scope: index.endpoints, id: entry.endpointId };
  }
  if (entry.kind === 'websocket' && type.isString(entry.websocketId)) {
    return { scope: index.websockets, id: entry.websocketId };
  }
  return null;
}

function describeVia(entry) {
  if (entry.kind === 'request') {
    return { requestId: entry.requestId, type: entry.type, via: entry.via };
  }
  if (entry.kind === 'step') {
    return { stepId: entry.stepId, type: entry.type, via: entry.via };
  }
  return { websocketId: entry.websocketId, type: entry.type, via: entry.via };
}

function addEdge({ index, entry, collection, direction }) {
  const owner = ownerOf({ entry, index });
  if (type.isNone(owner)) {
    return;
  }
  if (type.isUndefined(owner.scope[owner.id])) {
    owner.scope[owner.id] = { reads: {}, writes: {} };
  }
  const byCollection = owner.scope[owner.id][direction];
  if (type.isUndefined(byCollection[collection])) {
    byCollection[collection] = [];
  }
  byCollection[collection].push(describeVia(entry));
}

function sortAccess(byCollection) {
  return Object.keys(byCollection)
    .sort()
    .map((collection) => ({ collection, by: byCollection[collection] }));
}

function sortScope(scope) {
  const sorted = {};
  Object.keys(scope)
    .sort()
    .forEach((id) => {
      sorted[id] = { reads: sortAccess(scope[id].reads), writes: sortAccess(scope[id].writes) };
    });
  return sorted;
}

function indexDataAccess({ model }) {
  const index = { pages: {}, endpoints: {}, websockets: {} };
  Object.keys(model.collections ?? {}).forEach((collection) => {
    const entry = model.collections[collection];
    (entry.readers ?? []).forEach((reader) =>
      addEdge({ index, entry: reader, collection, direction: 'reads' })
    );
    (entry.writers ?? []).forEach((writer) =>
      addEdge({ index, entry: writer, collection, direction: 'writes' })
    );
  });
  return {
    pages: sortScope(index.pages),
    endpoints: sortScope(index.endpoints),
    websockets: sortScope(index.websockets),
  };
}

export default indexDataAccess;
