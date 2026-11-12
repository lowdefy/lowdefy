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

import request from './request.js';

// Endpoint calls carry the build id, so the server refuses a call from a client
// still running an earlier build, as it does for page requests.
//
// A host that sets callsEndpointsAcrossBuilds (a native shell) sends none, so a
// server build change never refuses its endpoint calls: endpoints are the
// stable contract a shell's cached pages and its later offline outbox call
// across builds. It is the host's own statement, not read from how the host
// signs in: a page shown as an MCP App view also holds a bearer session, but it
// is the web bundle of one build and is refused like a browser tab.
function createCallAPI(lowdefy) {
  const { apiBase, buildId } = lowdefy;
  const endpointBuildId =
    lowdefy._internal.host.callsEndpointsAcrossBuilds === true ? undefined : buildId;
  function callAPI({ payload, endpointId, pageId, blockId }) {
    return request({
      buildId: endpointBuildId,
      url: `${apiBase}/api/endpoints/${endpointId}`,
      method: 'POST',
      body: { payload, pageId, blockId },
      reloadOnAuthorizationError: false,
      lowdefy,
    });
  }
  return callAPI;
}

export default createCallAPI;
