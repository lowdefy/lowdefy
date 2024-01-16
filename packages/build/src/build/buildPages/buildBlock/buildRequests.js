/*
  Copyright 2020-2024 Lowdefy, Inc

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

function buildRequest(request, pageContext) {
  const { auth, checkDuplicateRequestId, pageId, typeCounters } = pageContext;
  if (type.isUndefined(request.id)) {
    throw new Error(`Request id missing at page "${pageId}".`);
  }
  if (!type.isString(request.id)) {
    throw new Error(
      `Request id is not a string at page "${pageId}". Received ${JSON.stringify(request.id)}.`
    );
  }
  checkDuplicateRequestId({ id: request.id, pageId });
  if (request.id.includes('.')) {
    throw new Error(
      `Request id "${request.id}" at page "${pageId}" should not include a period (".").`
    );
  }

  if (!type.isString(request.type)) {
    throw new Error(
      `Request type is not a string at at request at "${
        request.id
      }" at page "${pageId}". Received ${JSON.stringify(request.type)}.`
    );
  }
  typeCounters.requests.increment(request.type);

  if (type.isUndefined(request.payload)) request.payload = {};

  if (!type.isObject(request.payload)) {
    throw new Error(`Request "${request.id}" at page "${pageId}" payload should be an object.`);
  }

  request.auth = auth;
  request.requestId = request.id;
  request.pageId = pageId;
  request.id = `request:${pageId}:${request.id}`;
  pageContext.requests.push(request);
}

function buildRequests(block, pageContext) {
  (block.requests || []).forEach((request) => {
    buildRequest(request, pageContext);
  });
  delete block.requests;
}

export default buildRequests;
