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
import readBuiltArtifact from './readBuiltArtifact.js';
import readRoutineSteps from '../readRoutineSteps.js';

// The meta.dataSet declarations a data session runs against the session's databases (see
// lib/server/applyDataSetRedirect.js): 'redirect' takes its target's session database, 'walled'
// reaches them only through walled connections. Every other declaration, or none, would reach a real service or
// is refused by the gate.
const CLICKABLE_DATA_SET_MODES = new Set(['redirect', 'walled']);

// An 'external' type with request resolvers is clickable too: under a data session its requests
// are sunk (recorded, never sent), see lib/server/sinkExternalConnections.js. An external type
// with none (an Mcp config container) has nothing to sink and stays refused.
function isSunk({ connections, connectionType, dataSet }) {
  if (dataSet !== 'external') return false;
  const requests = connections[connectionType]?.requests;
  return type.isObject(requests) && Object.keys(requests).length > 0;
}

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
      const connection = readBuiltArtifact({
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
    const endpoint = readBuiltArtifact({ buildDirectory, name: `api/${id}.json` });
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

// The declared data-set mode of a connection type, from the plugin connection map the gate reads.
function dataSetMode({ connections, connectionType }) {
  if (type.isNone(connectionType)) return null;
  return connections[connectionType]?.meta?.dataSet ?? null;
}

// The blocks of a page whose events reach a connection a data set cannot run
// against its database, through a Request action or a CallAPI into endpoint
// routines. A connection is refused when its type declares meta.dataSet
// 'external', declares nothing (or any value but 'redirect' and 'walled'), or
// it has no artifact. Each block lists the connections it reaches as
// { connectionId, type, dataSet } (type null for a connection with no
// artifact, dataSet the declared value or null). The rails mirror the
// declaration only: a redirect connection whose properties the gate refuses
// fails when its request runs. A data-set journey may not click these blocks
// (see createDataSetRails). Ids computed by operators are not followed.
function findExternalBlocks({ buildDirectory, pageId, connections }) {
  const page = readBuiltArtifact({ buildDirectory, name: `pages/${pageId}.json` });
  if (page === null) {
    throw new Error(`Page "${pageId}" has no build artifact in ${buildDirectory}.`);
  }
  const pageRequestIds = (page.requests ?? []).map((request) => request.requestId);
  const connectionType = createConnectionReader({ buildDirectory });
  const blocks = {};
  pageBlocks(page).forEach(({ blockId, actions }) => {
    const reached = new Set();
    actions.forEach((action) => {
      if (action.type === 'Request') {
        requestedIds({ params: action.params, pageRequestIds }).forEach((requestId) => {
          const request = readBuiltArtifact({
            buildDirectory,
            name: `pages/${pageId}/requests/${requestId}.json`,
          });
          if (type.isString(request?.connectionId)) reached.add(request.connectionId);
        });
      }
      if (action.type === 'CallAPI' && type.isString(action.params?.endpointId)) {
        endpointConnections({ buildDirectory, endpointId: action.params.endpointId }).forEach(
          (connectionId) => reached.add(connectionId)
        );
      }
    });
    const external = [...reached]
      .sort()
      .map((connectionId) => {
        const reachedType = connectionType(connectionId);
        return {
          connectionId,
          type: reachedType,
          dataSet: dataSetMode({ connections, connectionType: reachedType }),
        };
      })
      .filter(
        (connection) =>
          !CLICKABLE_DATA_SET_MODES.has(connection.dataSet) &&
          !isSunk({ connections, connectionType: connection.type, dataSet: connection.dataSet })
      );
    if (external.length > 0) blocks[blockId] = external;
  });
  return { blocks };
}

export default findExternalBlocks;
