/* eslint-disable no-param-reassign */

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

import buildRoutine from './buildRoutine/buildRoutine.js';
import resolveEndpointSchedules from './resolveEndpointSchedules.js';
import validateDecideBranches from './validateDecideBranches.js';
import validateEndpoint from './validateEndpoint.js';
import validateStepReferences from './validateStepReferences.js';
import validateTenantNoneRead from '../validateTenantNoneRead.js';

function buildEndpoint({ endpoint, index, context, checkDuplicateEndpointId, environments }) {
  validateEndpoint({ endpoint, index, checkDuplicateEndpointId, environments });
  endpoint.endpointId = endpoint.id;
  resolveEndpointSchedules({ endpoint, environments });

  const isWebhook = !type.isNone(endpoint.webhook) && endpoint.webhook !== false;
  const verify = type.isObject(endpoint.webhook) ? endpoint.webhook.verify : undefined;
  if (!type.isNone(verify)) {
    // The verifier is a request run in a system context before the routine, so
    // it is held to the same tenant: none read-only rule as a step.
    validateTenantNoneRead({
      config: verify,
      location: `Webhook verifier at endpoint "${endpoint.endpointId}"`,
      requestMetas: context.typesMap?.requestMetas ?? {},
      tenantConnectionIds: context.tenantConnectionIds,
      configKey: verify['~k'],
    });
  }
  buildRoutine(endpoint.routine, {
    endpointId: endpoint.endpointId,
    // A webhook route answers the HTTP status a :reject sets, also from an InternalApi endpoint
    // the webhook calls. No other route sends one.
    rejectSetsStatus: isWebhook || endpoint.type === 'InternalApi',
    // Only the webhook's own :return is its answer: a called endpoint's :return is a step result.
    returnSetsContentType: isWebhook,
    dynamicPolicies: context.dynamicPolicies,
    typeCounters: context.typeCounters,
    stepTypes: context.typesMap?.steps ?? {},
    requestMetas: context.typesMap?.requestMetas ?? {},
    tenantConnectionIds: context.tenantConnectionIds,
    sharedTargets: context.sharedTargets,
    walledTargets: context.walledTargets,
  });

  // Validate that _step references point to defined step IDs
  validateStepReferences({ endpoint, context });

  // Validate Decide answers read and compared by the routine against the
  // questions the step declares
  validateDecideBranches({ endpoint, context });

  endpoint.id = `endpoint:${endpoint.endpointId}`;
}

export default buildEndpoint;
