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

import normaliseArtifact from './normaliseArtifact.js';

// Every object anywhere in value, depth first.
function eachObject(value, visit) {
  if (type.isArray(value)) {
    value.forEach((item) => eachObject(item, visit));
    return;
  }
  if (!type.isObject(value)) return;
  visit(value);
  Object.values(value).forEach((item) => eachObject(item, visit));
}

function calledEndpoints({ artifact, actionType }) {
  const endpointIds = [];
  eachObject(artifact, (object) => {
    if (object.type !== actionType) return;
    const endpointId =
      actionType === 'CallAPI' ? object.params?.endpointId : object.properties?.endpointId;
    if (type.isString(endpointId)) endpointIds.push(endpointId);
  });
  return endpointIds;
}

function usedConnections(artifact) {
  const connectionIds = [];
  eachObject(artifact, (object) => {
    if (type.isString(object.connectionId)) connectionIds.push(object.connectionId);
  });
  return connectionIds;
}

function subscribedWebsockets(page) {
  const websocketIds = [];
  (page.subscriptions ?? []).forEach((subscription) => {
    if (type.isString(subscription.websocketId)) websocketIds.push(subscription.websocketId);
  });
  eachObject(page, (object) => {
    if (object.type !== 'Subscribe') return;
    const websocketId = type.isObject(object.params) ? object.params.websocketId : object.params;
    if (type.isString(websocketId)) websocketIds.push(websocketId);
  });
  return websocketIds;
}

// What a page reaches in a build (readBuildArtifacts result): its requests,
// the endpoints its CallAPI actions name (followed through endpoint routines'
// CallApi steps), the connections those requests and endpoints use, and the
// websockets it subscribes to by a literal websocketId. Ids computed by
// operators are not followed.
function collectPageDependencies({ build, pageId }) {
  const page = normaliseArtifact(build.pages[pageId]);
  const requests = Object.keys(build.requests[pageId] ?? {}).sort();
  const connections = new Set();
  requests.forEach((requestId) => {
    usedConnections(normaliseArtifact(build.requests[pageId][requestId])).forEach((id) =>
      connections.add(id)
    );
  });
  const endpoints = new Set();
  const queue = calledEndpoints({ artifact: page, actionType: 'CallAPI' });
  while (queue.length > 0) {
    const endpointId = queue.shift();
    if (endpoints.has(endpointId)) continue;
    endpoints.add(endpointId);
    const endpoint = build.endpoints[endpointId];
    // A dev build only warns about a CallAPI naming an endpoint that does not
    // exist (callapi-refs), so the name can have no artifact.
    if (type.isNone(endpoint)) continue;
    const normalised = normaliseArtifact(endpoint);
    usedConnections(normalised).forEach((id) => connections.add(id));
    queue.push(...calledEndpoints({ artifact: normalised, actionType: 'CallApi' }));
  }
  return {
    requests,
    endpoints: [...endpoints].sort(),
    connections: [...connections].sort(),
    websockets: [...new Set(subscribedWebsockets(page))].sort(),
  };
}

export default collectPageDependencies;
