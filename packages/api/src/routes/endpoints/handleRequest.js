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

import addStepResult from './addStepResult.js';
import callRequestResolver from '../request/callRequestResolver.js';
import checkConnectionRead from '../request/checkConnectionRead.js';
import checkConnectionWrite from '../request/checkConnectionWrite.js';
import evaluateOperators from '../request/evaluateOperators.js';
import getConnection from '../connections/getConnection.js';
import getConnectionConfig from '../connections/getConnectionConfig.js';
import getRequestResolver from '../request/getRequestResolver.js';
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
  const tenant = resolveTenant(context, { connection, connectionConfig, requestConfig });
  if (trace) {
    trace.connection = {
      id: connectionConfig.connectionId,
      type: connectionConfig.type,
      tenant: tenant ?? null,
    };
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
  const result = await callRequestResolver(context, {
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
