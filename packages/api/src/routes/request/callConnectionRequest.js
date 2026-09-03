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

import callRequestResolver from './callRequestResolver.js';
import checkConnectionRead from './checkConnectionRead.js';
import checkConnectionWrite from './checkConnectionWrite.js';
import evaluateOperators from './evaluateOperators.js';
import getConnection from '../connections/getConnection.js';
import getConnectionConfig from '../connections/getConnectionConfig.js';
import getRequestResolver from './getRequestResolver.js';
import resolveCollectionSchema from './resolveCollectionSchema.js';
import validateSchemas from './validateSchemas.js';

import createEvaluateOperators from '../../context/createEvaluateOperators.js';

// Runs a request that exists nowhere in the app's config against one of its
// connections: the dev server's fixture seeding uses it to insert and delete
// documents through the connection layer. It follows callRequest through the
// same connection lookup, operator evaluation (so a databaseUri behind _secret
// or _env resolves), read/write checks, schema validation and resolver call,
// but skips what only a configured request has - page authorization and the
// tenant verdict. `tenant` is the caller's explicit decision; fixtures pass
// null so documents land exactly as written.
async function callConnectionRequest(
  context,
  { connectionId, requestId, type, properties = {}, rawProperties = false, tenant = null }
) {
  const { logger } = context;

  context.payload = {};
  context.evaluateOperators = createEvaluateOperators(context);

  logger.debug({ event: 'debug_connection_request', connectionId, requestId, type });
  const connectionConfig = await getConnectionConfig(context, { connectionId });
  const requestConfig = { connectionId, requestId, type, properties };

  const connection = getConnection(context, { connectionConfig });
  const requestResolver = getRequestResolver(context, { connection, requestConfig });

  // A fixture document is data, not config: a key like `_secret` or `_js`
  // inside a seeded document must be stored exactly as it was written, never
  // executed. rawProperties holds the request's properties back from the
  // operator pass; the connection's own properties are evaluated either way,
  // so a databaseUri behind _secret still resolves.
  const evaluated = evaluateOperators(context, {
    connectionConfig,
    payload: {},
    requestConfig: rawProperties ? { ...requestConfig, properties: {} } : requestConfig,
    state: {},
    steps: {},
  });
  const { connectionProperties } = evaluated;
  const requestProperties = rawProperties ? properties : evaluated.requestProperties;

  // The same field contract every configured write is held to. Without it a
  // seeded document could hold data the app itself could never write.
  const collectionSchema = await resolveCollectionSchema(context, {
    collectionName: connectionProperties.collection,
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
    collectionSchema,
    connectionProperties,
    endpointDepth: 0,
    requestConfig,
    requestProperties,
    requestResolver,
    tenant,
  });
  return { connectionProperties, response };
}

export default callConnectionRequest;
