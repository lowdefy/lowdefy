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

import getCurrentEnvironment from '../../context/getCurrentEnvironment.js';
import invokeEndpoint from '../endpoints/invokeEndpoint.js';
import summarisedError from './summarisedError.js';

async function callRequestResolver(
  context,
  { connectionProperties, endpointDepth, requestConfig, requestProperties, requestResolver }
) {
  const { blockId, endpointId, logger, pageId, payload } = context;
  // stepId for endpoint steps (after build), requestId for page requests
  const stepOrRequestId = requestConfig.stepId ?? requestConfig.requestId;

  const callApi = async ({ endpointId: targetEndpointId, payload: targetPayload } = {}) => {
    logger.debug({
      event: 'debug_start_call_api',
      connectionId: requestConfig.connectionId,
      requestId: stepOrRequestId,
      endpointId: targetEndpointId,
    });

    const result = await invokeEndpoint(context, {
      endpointId: targetEndpointId,
      payload: targetPayload,
      endpointDepth,
    });

    if (result.status === 'error' || result.status === 'reject') {
      throw result.error;
    }

    const response = result.status === 'return' ? result.response : null;

    logger.debug({
      event: 'debug_end_call_api',
      connectionId: requestConfig.connectionId,
      requestId: stepOrRequestId,
      endpointId: targetEndpointId,
    });

    return response;
  };

  try {
    const response = await requestResolver({
      blockId,
      callApi,
      connection: connectionProperties,
      connectionId: requestConfig.connectionId,
      endpointId,
      // The deployment's current environment ({ name, url, email, ... }) or null, so connection
      // types can apply environment settings such as the email delivery filter.
      environment: getCurrentEnvironment({ config: context.config }),
      pageId,
      payload,
      request: requestProperties,
      requestId: stepOrRequestId,
    });
    return response;
  } catch (error) {
    // Add configKey to any error for location tracing. A thrown string or null takes no
    // property, and the TypeError assigning one raises would quote the string.
    if (error instanceof Object && !error.configKey) {
      error.configKey = requestConfig['~k'];
    }

    // Lowdefy errors pass through unchanged — re-wrapping every boundary would
    // nest causes and truncate the deepest (most informative) frame.
    if (error?.isLowdefyError) {
      logger.debug(
        { params: { id: stepOrRequestId, type: requestConfig.type }, err: error },
        error.message
      );
      throw error;
    }

    // The error that leaves here is logged whole at error level by the server's error handler
    // and sent to Sentry, so it carries ids and the resolver's error summarised - never the request's
    // evaluated properties (an agent chat's save-thread step holds the whole thread there) or
    // the connection's error itself, which can embed the document it rejected. The dev tools
    // still show that error: it is kept as devCause, which is not enumerable, so no log or error
    // report walks it, and only the dev error payload reads it. stepId, not requestId: on an
    // error requestId is the HTTP request's id (context.rid) everywhere else.
    const cause = summarisedError(error);
    const addFields = (wrapped) => {
      Object.assign(wrapped, {
        endpointId: requestConfig.endpointId ?? endpointId,
        stepId: stepOrRequestId,
        connectionId: requestConfig.connectionId,
      });
      Object.defineProperty(wrapped, 'devCause', { value: error, configurable: true });
    };

    // Check if this is a service error (network, timeout, 5xx)
    if (ServiceError.isServiceError(error)) {
      const serviceError = new ServiceError(undefined, {
        cause,
        service: requestConfig.connectionId,
        configKey: requestConfig['~k'],
      });
      addFields(serviceError);
      logger.debug(
        { params: { id: stepOrRequestId, type: requestConfig.type }, err: serviceError },
        serviceError.message
      );
      throw serviceError;
    }

    // Wrap other errors in RequestError (request/connection logic error)
    const requestError = new RequestError(cause.message, {
      cause,
      typeName: requestConfig.type,
      location: `${requestConfig.connectionId}/${stepOrRequestId}`,
      configKey: requestConfig['~k'],
    });
    addFields(requestError);

    logger.debug(
      { params: { id: stepOrRequestId, type: requestConfig.type }, err: requestError },
      requestError.message
    );
    throw requestError;
  }
}

export default callRequestResolver;
