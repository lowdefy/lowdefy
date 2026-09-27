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

import buildRoutine from './buildRoutine/buildRoutine.js';
import resolveEndpointSchedules from './resolveEndpointSchedules.js';
import validateDecideBranches from './validateDecideBranches.js';
import validateEndpoint from './validateEndpoint.js';
import validateStepReferences from './validateStepReferences.js';

function buildEndpoint({ endpoint, index, context, checkDuplicateEndpointId, environments }) {
  validateEndpoint({ endpoint, index, checkDuplicateEndpointId, environments });
  endpoint.endpointId = endpoint.id;
  resolveEndpointSchedules({ endpoint, environments });

  buildRoutine(endpoint.routine, {
    endpointId: endpoint.endpointId,
    typeCounters: context.typeCounters,
    stepTypes: context.typesMap?.steps ?? {},
    tenantConnectionIds: context.tenantConnectionIds,
  });

  // Validate that _step references point to defined step IDs
  validateStepReferences({ endpoint, context });

  // Validate Decide answers read and compared by the routine against the
  // questions the step declares
  validateDecideBranches({ endpoint, context });

  endpoint.id = `endpoint:${endpoint.endpointId}`;
}

export default buildEndpoint;
