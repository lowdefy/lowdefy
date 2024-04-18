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

import { serializer } from '@lowdefy/helpers';

import authorizeRequest from './authorizeRequest.js';
import callRequestResolver from './callRequestResolver.js';
import checkConnectionRead from './checkConnectionRead.js';
import checkConnectionWrite from './checkConnectionWrite.js';
import evaluateOperators from './evaluateOperators.js';
import getConnection from './getConnection.js';
import getConnectionConfig from './getConnectionConfig.js';
import getRequestConfig from './getRequestConfig.js';
import getRequestResolver from './getRequestResolver.js';
import validateSchemas from './validateSchemas.js';

async function callRequest(context, { blockId, pageId, payload, requestId }) {
  const { logger } = context;
  logger.debug({ event: 'debug_request', blockId, pageId, payload, requestId });
  const requestConfig = await getRequestConfig(context, { pageId, requestId });
  const connectionConfig = await getConnectionConfig(context, { requestConfig });
  authorizeRequest(context, { requestConfig });

  const connection = getConnection(context, { connectionConfig });
  const requestResolver = getRequestResolver(context, { connection, requestConfig });
  const deserializedPayload = serializer.deserialize(payload);

  const { connectionProperties, requestProperties } = evaluateOperators(context, {
    connectionConfig,
    payload: deserializedPayload,
    requestConfig,
  });
  checkConnectionRead(context, {
    connectionConfig,
    connectionProperties,
    requestConfig,
    requestResolver,
  });
  checkConnectionWrite(context, {
    connectionConfig,
    connectionProperties,
    requestConfig,
    requestResolver,
  });
  validateSchemas(context, {
    connection,
    connectionProperties,
    requestConfig,
    requestResolver,
    requestProperties,
  });
  const response = await callRequestResolver(context, {
    blockId,
    connectionProperties,
    payload: deserializedPayload,
    requestConfig,
    requestProperties,
    requestResolver,
  });
  return {
    id: requestConfig.id,
    success: true,
    type: requestConfig.type,
    response: serializer.serialize(response),
  };
}

export default callRequest;
