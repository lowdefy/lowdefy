/*
  Copyright 2020-2021 Lowdefy, Inc

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

function buildRequests(block, blockContext) {
  if (!type.isNone(block.requests)) {
    if (!type.isArray(block.requests)) {
      throw new Error(
        `Requests is not an array at ${block.blockId} on page ${
          blockContext.pageId
        }. Received ${JSON.stringify(block.requests)}`
      );
    }
    block.requests.forEach((request) => {
      request.auth = blockContext.auth;
      request.requestId = request.id;
      request.contextId = blockContext.contextId;
      request.id = `request:${blockContext.pageId}:${blockContext.contextId}:${request.id}`;
      blockContext.requests.push(request);
    });
    delete block.requests;
  }
}

export default buildRequests;
