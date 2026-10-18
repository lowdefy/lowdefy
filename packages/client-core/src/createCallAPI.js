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

// Endpoint calls from a bearer host (a native shell) carry no build id, so a
// server build change never refuses them: endpoints are the stable contract a
// shell's cached pages and its later offline outbox call across builds. Page
// requests keep the build id on every host.
function createCallAPI(lowdefy) {
  const { apiBase, buildId } = lowdefy;
  const endpointBuildId = lowdefy._internal.host.authTransport === 'bearer' ? undefined : buildId;
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
