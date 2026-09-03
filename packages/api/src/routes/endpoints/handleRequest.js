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

import addStepResult from './addStepResult.js';
import callRequestResolver from '../request/callRequestResolver.js';
import checkConnectionRead from '../request/checkConnectionRead.js';
import checkConnectionWrite from '../request/checkConnectionWrite.js';
import evaluateOperators from '../request/evaluateOperators.js';
import getConnection from '../connections/getConnection.js';
import getConnectionConfig from '../connections/getConnectionConfig.js';
import getRequestResolver from '../request/getRequestResolver.js';
import resolveRunAs from './resolveRunAs.js';
import resolveCollectionSchema from '../request/resolveCollectionSchema.js';
import resolveTenant from '../request/resolveTenant.js';
import validateSchemas from '../request/validateSchemas.js';

// routineContext.trace is an optional dev-only collector (the `explain` flag of
// lowdefy_run_endpoint): an array that gains one entry per request step,
// carrying the step id, the tenancy verdict, the evaluated properties, the
// effective query and the wall's rewrites. Absent, nothing is allocated.
async function handleRequest(context, routineContext, { request }) {
  const { logger } = context;
  const { items } = routineContext;
  let trace;
  if (routineContext.trace) {
    trace = { stepId: request.stepId, rewritten: [] };
    routineContext.trace.push(trace);
  }

  logger.debug({
    event: 'debug_start_request',
    request,
  });
  const requestConfig = request;
  const connectionConfig = await getConnectionConfig(context, {
    connectionId: requestConfig.connectionId,
    configKey: requestConfig['~k'],
  });

  const connection = getConnection(context, { connectionConfig });
  const requestResolver = getRequestResolver(context, { connection, requestConfig });
  // A step-level runAs is evaluated against the routine context as it stands
  // at this step, so `_step` reads the results before it; otherwise the
  // endpoint-level scope (if any) applies.
  const runAs = type.isNone(requestConfig.runAs)
    ? routineContext.runAs
    : resolveRunAs(context, routineContext, {
        runAs: requestConfig.runAs,
        location: requestConfig.stepId,
        configKey: requestConfig['~k'],
        source: 'step',
      });
  const tenant = resolveTenant(context, { connection, connectionConfig, requestConfig, runAs });
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
    items,
    payload: routineContext.payload,
    requestConfig,
    state: routineContext.state,
    steps: routineContext.steps,
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
  const result = await callRequestResolver(context, {
    collectionSchema,
    connectionProperties,
    endpointDepth: routineContext.endpointDepth,
    requestConfig,
    requestProperties,
    requestResolver,
    tenant,
    trace,
  });

  addStepResult(context, routineContext, { result, stepId: request.stepId });

  context.logger.debug({
    event: 'debug_end_request',
    id: requestConfig.id,
    result,
  });
  return { status: 'continue' };
}

export default handleRequest;
