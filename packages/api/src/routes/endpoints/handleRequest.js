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

import callRequestResolver from '../request/callRequestResolver.js';
import checkConnectionRead from '../request/checkConnectionRead.js';
import checkConnectionWrite from '../request/checkConnectionWrite.js';
import evaluateOperators from '../request/evaluateOperators.js';
import getConnection from '../request/getConnection.js';
import getConnectionConfig from '../request/getConnectionConfig.js';
import getRequestResolver from '../request/getRequestResolver.js';
import validateSchemas from '../request/validateSchemas.js';

async function handleRequest(context, routineContext, { request }) {
  const { logger } = context;

  logger.debug({
    event: 'debug_start_request',
    request,
  });
  const requestConfig = request;
  const connectionConfig = await getConnectionConfig(context, { requestConfig });

  const connection = getConnection(context, { connectionConfig });
  const requestResolver = getRequestResolver(context, { connection, requestConfig });

  const { connectionProperties, requestProperties } = evaluateOperators(context, {
    connectionConfig,
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
  const requestResult = await callRequestResolver(context, {
    blockId: context.blockId,
    connectionProperties,
    pageId: context.pageId,
    payload: context.payload,
    requestConfig,
    requestProperties,
    requestResolver,
  });
  context.logger.debug({
    event: 'debug_end_request',
    requestResult,
  });
  return { status: 'continue' };
}

export default handleRequest;
