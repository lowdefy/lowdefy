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
import { ConfigError } from '@lowdefy/errors';

import collectExceptions from '../../../utils/collectExceptions.js';
import validateId from '../../../utils/validateId.js';
import validateTenantPipeline from '../../validateTenantPipeline.js';

function buildRequest(request, pageContext) {
  const { auth, checkDuplicateRequestId, context, pageId, typeCounters } = pageContext;
  const configKey = request['~k'];
  if (type.isUndefined(request.id)) {
    throw new ConfigError(`Request id missing at page "${pageId}".`, { configKey });
  }
  if (!type.isString(request.id)) {
    throw new ConfigError(`Request id is not a string at page "${pageId}".`, {
      received: request.id,
      configKey,
    });
  }
  checkDuplicateRequestId({ id: request.id, configKey, pageId });
  validateId({ id: request.id, field: 'Request id', location: `page "${pageId}"`, configKey });

  if (!type.isString(request.type)) {
    throw new ConfigError(
      `Request type is not a string at request "${request.id}" at page "${pageId}".`,
      { received: request.type, configKey }
    );
  }
  typeCounters.requests.increment(request.type, configKey);

  // Validate connectionId references an existing connection
  if (!type.isNone(request.connectionId)) {
    if (!type.isString(request.connectionId)) {
      throw new ConfigError(
        `Request "${request.id}" at page "${pageId}" connectionId is not a string.`,
        { received: request.connectionId, configKey }
      );
    }
    if (!context.connectionIds.has(request.connectionId)) {
      // Collected: the request still builds, so the page reports the rest of
      // its errors in the same build and a suppressed check leaves the page
      // whole.
      collectExceptions(
        context,
        new ConfigError(
          `Request "${request.id}" at page "${pageId}" references non-existent connection "${request.connectionId}".`,
          { configKey, checkSlug: 'connection-refs' }
        )
      );
    }
  }

  // Request-level tenant values are the exception sentinels — the wall itself
  // is declared on the connection, never per request. "none" opts the request
  // out of the wall (system context); "authored" declares the request authors
  // its own tenant clause in a stage the wall can not scope mechanically,
  // audited at runtime.
  if (
    !type.isUndefined(request.tenant) &&
    request.tenant !== 'none' &&
    request.tenant !== 'authored'
  ) {
    throw new ConfigError(
      `Request "${request.id}" at page "${pageId}" "tenant" only accepts "none" or "authored" — the tenant wall is declared on the connection.`,
      { received: request.tenant, configKey }
    );
  }

  // Best-effort (literal pipelines only): every refusal the tenant wall raises
  // at request time on a walled pipeline, raised at build instead. The walker
  // returns its findings, so a pipeline with several reports all of them and
  // the rest of the page keeps building.
  validateTenantPipeline({
    config: request,
    location: `Request "${request.id}" at page "${pageId}"`,
    tenantConnections: context.tenantConnections,
    tenantCollectionMap: context.tenantCollectionMap,
    collections: context.collections,
    configKey,
  }).forEach((error) => collectExceptions(context, error));

  if (type.isUndefined(request.payload)) request.payload = {};

  if (!type.isObject(request.payload)) {
    throw new ConfigError(
      `Request "${request.id}" at page "${pageId}" payload should be an object.`,
      { configKey }
    );
  }

  request.auth = auth;
  request.requestId = request.id;
  request.pageId = pageId;
  request.id = `request:${pageId}:${request.id}`;
  pageContext.requests.push(request);
}

function buildRequests(block, pageContext) {
  // Runtime-resolved dynamic content cannot define requests — request
  // artifacts are written at build time, so a runtime request would have no
  // server-side properties to execute.
  if (pageContext.forbidRequests === true && !type.isNone(block.requests)) {
    throw new ConfigError(
      `Dynamic content must not define requests — found "requests" on block "${block.blockId}" on page "${pageContext.pageId}". Reference requests defined statically on the page instead.`,
      { received: block.requests, configKey: block['~k'] }
    );
  }
  (block.requests || []).forEach((request) => {
    buildRequest(request, pageContext);
  });
  delete block.requests;
}

export default buildRequests;
