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

// A request with `offline: queue` goes through the host's request queue when it has one (a native
// shell, src/queue in @lowdefy/shell): the queue sends it at once when it can, and otherwise keeps
// it and answers { queued: true, id } as the response. The web host has no queue, so it sends as
// any request.
function createCallRequest(lowdefy) {
  const { apiBase, buildId } = lowdefy;
  function callRequest({ actionId, blockId, offline, pageId, payload, requestId }) {
    const url = `${apiBase}/api/request/${pageId}/${requestId}`;
    const body = { actionId, blockId, payload };
    const send = () =>
      request({
        buildId,
        url,
        method: 'POST',
        body,
        reloadOnAuthorizationError: true,
        lowdefy,
      });
    const { requestQueue } = lowdefy._internal.host;
    if (offline === 'queue' && requestQueue) {
      return requestQueue.send({ body, buildId, pageId, requestId, send, url });
    }
    return send();
  }
  return callRequest;
}

export default createCallRequest;
