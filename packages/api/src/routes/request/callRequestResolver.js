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

import { ConfigError, RequestError, ServiceError } from '@lowdefy/errors';

async function callRequestResolver(
  { blockId, endpointId, logger, pageId, payload },
  { connectionProperties, requestConfig, requestProperties, requestResolver }
) {
  try {
    const response = await requestResolver({
      blockId,
      endpointId,
      connection: connectionProperties,
      connectionId: requestConfig.connectionId,
      pageId,
      payload,
      request: requestProperties,
      requestId: requestConfig.requestId,
    });
    return response;
  } catch (error) {
    // Add configKey to any error for location tracing
    if (!error.configKey) {
      error.configKey = requestConfig['~k'];
    }

    if (error instanceof ConfigError) {
      logger.debug(
        { params: { id: requestConfig.requestId, type: requestConfig.type }, err: error },
        error.message
      );
      throw error;
    }

    // Check if this is a service error (network, timeout, 5xx)
    if (ServiceError.isServiceError(error)) {
      const serviceError = new ServiceError(undefined, {
        cause: error,
        service: requestConfig.connectionId,
        configKey: requestConfig['~k'],
      });
      logger.debug(
        { params: { id: requestConfig.requestId, type: requestConfig.type }, err: serviceError },
        serviceError.message
      );
      throw serviceError;
    }

    // Wrap other errors in RequestError (request/connection logic error)
    const requestError = new RequestError(error.message, {
      cause: error,
      typeName: requestConfig.type,
      received: requestProperties,
      location: `${requestConfig.connectionId}/${requestConfig.requestId}`,
      configKey: requestConfig['~k'],
    });

    logger.debug(
      { params: { id: requestConfig.requestId, type: requestConfig.type }, err: requestError },
      requestError.message
    );
    throw requestError;
  }
}

export default callRequestResolver;
