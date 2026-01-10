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
import formatConfigError from '../../../utils/formatConfigError.js';

function buildRequest(request, pageContext) {
  const { auth, checkDuplicateRequestId, context, pageId, typeCounters } = pageContext;
  const configKey = request['~k'];
  if (type.isUndefined(request.id)) {
    throw new Error(
      formatConfigError({
        message: `Request id missing at page "${pageId}".`,
        configKey,
        context,
      })
    );
  }
  if (!type.isString(request.id)) {
    throw new Error(
      formatConfigError({
        message: `Request id is not a string at page "${pageId}". Received ${JSON.stringify(request.id)}.`,
        configKey,
        context,
      })
    );
  }
  checkDuplicateRequestId({ id: request.id, configKey, pageId });
  if (request.id.includes('.')) {
    throw new Error(
      formatConfigError({
        message: `Request id "${request.id}" at page "${pageId}" should not include a period (".").`,
        configKey,
        context,
      })
    );
  }

  if (!type.isString(request.type)) {
    throw new Error(
      formatConfigError({
        message: `Request type is not a string at request "${request.id}" at page "${pageId}". Received ${JSON.stringify(request.type)}.`,
        configKey,
        context,
      })
    );
  }
  typeCounters.requests.increment(request.type, configKey);

  if (type.isUndefined(request.payload)) request.payload = {};

  if (!type.isObject(request.payload)) {
    throw new Error(
      formatConfigError({
        message: `Request "${request.id}" at page "${pageId}" payload should be an object.`,
        configKey,
        context,
      })
    );
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
