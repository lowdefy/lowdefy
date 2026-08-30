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
import resolveTenant from '../request/resolveTenant.js';
import validateSchemas from '../request/validateSchemas.js';

async function handleRequest(context, routineContext, { request }) {
  const { logger } = context;
  const { items } = routineContext;

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

  const { connectionProperties, requestProperties } = evaluateOperators(context, {
    connectionConfig,
    items,
    payload: routineContext.payload,
    requestConfig,
    state: routineContext.state,
    steps: routineContext.steps,
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
  const result = await callRequestResolver(context, {
    connectionProperties,
    endpointDepth: routineContext.endpointDepth,
    requestConfig,
    requestProperties,
    requestResolver,
    tenant,
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
