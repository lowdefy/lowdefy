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

import pageBlocks from '../pageBlocks.js';
import readExploreArtifact from './readExploreArtifact.js';
import readRoutineSteps from '../readRoutineSteps.js';

// The one connection type a walk's data set redirects; every other type would
// be reached for real.
const DATA_SET_CONNECTION_TYPE = 'MongoDBCollection';

function requestedIds({ params, pageRequestIds }) {
  if (type.isString(params)) return [params];
  if (type.isArray(params)) return params.filter((id) => type.isString(id));
  if (!type.isObject(params)) return [];
  if (params.all === true) return pageRequestIds;
  if (type.isString(params.requestId)) return [params.requestId];
  if (type.isArray(params.requestIds)) return params.requestIds.filter((id) => type.isString(id));
  return [];
}

function createConnectionReader({ buildDirectory }) {
  const types = new Map();
  return function connectionType(connectionId) {
    if (!types.has(connectionId)) {
      const connection = readExploreArtifact({
        buildDirectory,
        name: `connections/${connectionId}.json`,
      });
      types.set(connectionId, connection?.type ?? null);
    }
    return types.get(connectionId);
  };
}

// The connections an endpoint's routine reaches, through endpoints its
// CallApi steps call. A dev build only warns about a call to an endpoint
// with no artifact (callapi-refs), so such a call reaches nothing.
function endpointConnections({ buildDirectory, endpointId }) {
  const connections = new Set();
  const seen = new Set();
  const queue = [endpointId];
  while (queue.length > 0) {
    const id = queue.shift();
    if (seen.has(id)) continue;
    seen.add(id);
    const endpoint = readExploreArtifact({ buildDirectory, name: `api/${id}.json` });
    if (endpoint === null) continue;
    readRoutineSteps({ routine: endpoint.routine }).forEach((step) => {
      if (type.isString(step.connectionId)) connections.add(step.connectionId);
      if (step.type === 'CallApi' && type.isString(step.properties?.endpointId)) {
        queue.push(step.properties.endpointId);
      }
    });
  }
  return connections;
}

// The blocks of a page whose events reach a connection a data set does not
// redirect (any type but MongoDBCollection), through a Request action or a
// CallAPI into endpoint routines, with the connections each reaches. A walk
// offers no control on these blocks unless the run allows every connection.
// Ids computed by operators are not followed.
function findExternalBlocks({ buildDirectory, pageId }) {
  const page = readExploreArtifact({ buildDirectory, name: `pages/${pageId}.json` });
  if (page === null) {
    throw new Error(`Page "${pageId}" has no build artifact in ${buildDirectory}.`);
  }
  const pageRequestIds = (page.requests ?? []).map((request) => request.requestId);
  const connectionType = createConnectionReader({ buildDirectory });
  const blocks = {};
  pageBlocks(page).forEach(({ blockId, actions }) => {
    const connections = new Set();
    actions.forEach((action) => {
      if (action.type === 'Request') {
        requestedIds({ params: action.params, pageRequestIds }).forEach((requestId) => {
          const request = readExploreArtifact({
            buildDirectory,
            name: `pages/${pageId}/requests/${requestId}.json`,
          });
          if (type.isString(request?.connectionId)) connections.add(request.connectionId);
        });
      }
      if (action.type === 'CallAPI' && type.isString(action.params?.endpointId)) {
        endpointConnections({ buildDirectory, endpointId: action.params.endpointId }).forEach(
          (connectionId) => connections.add(connectionId)
        );
      }
    });
    const external = [...connections]
      .filter((connectionId) => connectionType(connectionId) !== DATA_SET_CONNECTION_TYPE)
      .sort();
    if (external.length > 0) blocks[blockId] = external;
  });
  return { blocks };
}

export default findExternalBlocks;
