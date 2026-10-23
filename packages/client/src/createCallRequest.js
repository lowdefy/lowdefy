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

import NonJsonResponseError from './NonJsonResponseError.js';
import request from './request.js';

// A read-only request (the build marks one whose type only reads) is sent once
// more when the host fails it before the app answers. A write is never sent
// again: the host's failure can come after the app wrote.
function createCallRequest(lowdefy) {
  const { basePath, buildId } = lowdefy;
  function send({ actionId, blockId, pageId, payload, requestId }) {
    return request({
      buildId,
      url: `${basePath}/api/request/${pageId}/${requestId}`,
      method: 'POST',
      body: { actionId, blockId, payload },
      reloadOnAuthorizationError: true,
      lowdefy,
    });
  }
  async function callRequest({ actionId, blockId, pageId, payload, readOnly, requestId }) {
    try {
      return await send({ actionId, blockId, pageId, payload, requestId });
    } catch (error) {
      if (readOnly !== true || !(error instanceof NonJsonResponseError)) {
        throw error;
      }
      lowdefy._internal.logger.warn(
        `Request "${requestId}" on page "${pageId}" failed with status ${error.status} before the app answered. Sending it again. ${error.responseText}`
      );
      return send({ actionId, blockId, pageId, payload, requestId });
    }
  }
  return callRequest;
}

export default createCallRequest;
