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

import { serializer } from '@lowdefy/helpers';

import authorizeRequest from './authorizeRequest.js';
import callRequestResolver from './callRequestResolver.js';
import checkConnectionRead from './checkConnectionRead.js';
import checkConnectionWrite from './checkConnectionWrite.js';
import evaluateOperators from './evaluateOperators.js';
import getConnection from '../connections/getConnection.js';
import getConnectionConfig from '../connections/getConnectionConfig.js';
import getRequestConfig from './getRequestConfig.js';
import getRequestResolver from './getRequestResolver.js';
import resolveCollectionSchema from './resolveCollectionSchema.js';
import resolveTenant from './resolveTenant.js';
import validateSchemas from './validateSchemas.js';

import createEvaluateOperators from '../../context/createEvaluateOperators.js';
import redactResponse from '../../response/redactResponse.js';

// `trace` is an optional dev-only collector (the `explain` flag of the dev
// tools). When present it records the tenancy verdict and the evaluated
// properties, and is handed to the resolver so it can report the effective
// query. Absent, nothing is allocated and the result is unchanged.
async function callRequest(context, { blockId, pageId, payload, requestId, trace }) {
  const { logger } = context;

  context.blockId = blockId;
  context.pageId = pageId;
  const requestPayload = serializer.deserialize(payload);
  context.payload = requestPayload;
  context.evaluateOperators = createEvaluateOperators(context);

  logger.debug({ event: 'debug_request', blockId, pageId, payload, requestId });
  const requestConfig = await getRequestConfig(context, { pageId, requestId });
  const connectionConfig = await getConnectionConfig(context, {
    connectionId: requestConfig.connectionId,
    configKey: requestConfig['~k'],
  });
  authorizeRequest(context, { requestConfig });

  const connection = getConnection(context, { connectionConfig });
  const requestResolver = getRequestResolver(context, { connection, requestConfig });
  const tenant = resolveTenant(context, { connection, connectionConfig, requestConfig });
  if (trace) {
    trace.connection = {
      id: connectionConfig.connectionId,
      type: connectionConfig.type,
      tenant: tenant ?? null,
    };
    // The request type, not the connection type: the explain note names the
    // request the agent asked about (MongoDBFind), not the connection it runs
    // on (MongoDBCollection).
    trace.requestType = requestConfig.type;
  }

  const { connectionProperties, requestProperties } = evaluateOperators(context, {
    connectionConfig,
    payload: requestPayload,
    requestConfig,
    state: {},
    steps: {},
  });
  if (trace) {
    trace.properties = requestProperties;
  }
  // Only write types consult the collection contract, so a read path never
  // pays for the artifact lookup.
  const collectionSchema =
    requestResolver.meta.checkWrite === true
      ? await resolveCollectionSchema(context, {
          collectionName: connectionProperties.collection,
        })
      : null;

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
  // trace.dispatched separates a run that reached the resolver from one that
  // failed before it - an operator error, a wall refusal, a schema violation -
  // so the explain note can say which.
  if (trace) {
    trace.dispatched = true;
  }
  const response = await callRequestResolver(context, {
    collectionSchema,
    connectionProperties,
    endpointDepth: 0,
    requestConfig,
    requestProperties,
    requestResolver,
    tenant,
    trace,
  });
  return {
    id: requestConfig.id,
    success: true,
    type: requestConfig.type,
    response: redactResponse(context, response),
  };
}

export default callRequest;
