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

import { RequestError, ServiceError } from '@lowdefy/errors';

import invokeEndpoint from '../endpoints/invokeEndpoint.js';
import logEvent from '../../log/logEvent.js';

async function callRequestResolver(
  context,
  {
    collectionSchema,
    connectionProperties,
    endpointDepth,
    requestConfig,
    requestProperties,
    requestResolver,
    tenant,
    trace,
  }
) {
  const { blockId, endpointId, pageId, payload } = context;
  // stepId for endpoint steps (after build), requestId for page requests
  const stepOrRequestId = requestConfig.stepId ?? requestConfig.requestId;

  // The invoked endpoint emits its own endpoint_completed line, so a resolver
  // reaching back into the app through callApi needs nothing here.
  const callApi = async ({ endpointId: targetEndpointId, payload: targetPayload } = {}) => {
    const result = await invokeEndpoint(context, {
      endpointId: targetEndpointId,
      payload: targetPayload,
      endpointDepth,
    });

    if (result.status === 'error' || result.status === 'reject') {
      throw result.error;
    }

    return result.status === 'return' ? result.response : null;
  };

  const eventFields = {
    request_id: stepOrRequestId,
    connection_id: requestConfig.connectionId,
    request_type: requestConfig.type,
    endpoint_id: endpointId,
    config_key: requestConfig['~k'],
    org: tenant?.value,
  };
  const startTime = performance.now();
  const logFailed = (error) =>
    logEvent({
      context,
      event: 'request_failed',
      fields: {
        ...eventFields,
        duration_ms: Math.round(performance.now() - startTime),
        success: false,
        error,
      },
    });

  try {
    const response = await requestResolver({
      blockId,
      callApi,
      // The field contract ({ name, fields } or null) resolved by
      // resolveCollectionSchema from build/collections.json - connection types
      // that implement write validation check insert documents and $set /
      // $setOnInsert values against it before touching the database.
      collectionSchema: collectionSchema ?? null,
      connection: connectionProperties,
      connectionId: requestConfig.connectionId,
      endpointId,
      pageId,
      payload,
      request: requestProperties,
      requestId: stepOrRequestId,
      // The tenant verdict ({ field, value } or null/undefined) computed by
      // resolveTenant - connection types implementing the scoping contract
      // enforce it (stamp writes, merge filters, inject pipeline matches).
      tenant: tenant ?? null,
      // Optional dev-only collector, allocated by the dev tools' `explain`
      // flag and undefined otherwise. A resolver that supports it sets
      // trace.effective to the value it sends to its driver and hands trace to
      // its tenant helpers so they can record each rewrite on
      // trace.rewritten. A resolver that ignores it behaves exactly as before.
      trace,
    });
    logEvent({
      context,
      event: 'request_completed',
      fields: {
        ...eventFields,
        duration_ms: Math.round(performance.now() - startTime),
        success: true,
      },
    });
    return response;
  } catch (error) {
    // Add configKey to any error for location tracing
    if (!error.configKey) {
      error.configKey = requestConfig['~k'];
    }

    // Lowdefy errors pass through unchanged — re-wrapping every boundary would
    // nest causes and truncate the deepest (most informative) frame.
    if (error.isLowdefyError) {
      logFailed(error);
      throw error;
    }

    // Check if this is a service error (network, timeout, 5xx)
    if (ServiceError.isServiceError(error)) {
      const serviceError = new ServiceError(undefined, {
        cause: error,
        service: requestConfig.connectionId,
        configKey: requestConfig['~k'],
      });
      logFailed(serviceError);
      throw serviceError;
    }

    // Wrap other errors in RequestError (request/connection logic error)
    const requestError = new RequestError(error.message, {
      cause: error,
      typeName: requestConfig.type,
      received: requestProperties,
      location: `${requestConfig.connectionId}/${stepOrRequestId}`,
      configKey: requestConfig['~k'],
    });

    logFailed(requestError);
    throw requestError;
  }
}

export default callRequestResolver;
