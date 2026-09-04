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

import { getSchemaAtPath } from '@lowdefy/ajv';
import { ConfigError } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

import collectExceptions from '../../utils/collectExceptions.js';
import collectRoutineSteps from './collectRoutineSteps.js';
import extractOperatorPath from '../../utils/extractOperatorPath.js';
import findSimilarString from '../../utils/findSimilarString.js';
import traverseConfig from '../../utils/traverseConfig.js';

// A CallApi step stores the target endpoint's :return value directly, so a
// _step.<stepId>.<rest> read is checked against that endpoint's responseSchema.
function validateStepResponsePaths({ endpoint, endpointConfigs, context }) {
  const schemasByEndpointId = new Map();
  endpointConfigs.forEach((config) => {
    if (type.isObject(config.responseSchema)) {
      schemasByEndpointId.set(config.endpointId ?? config.id, config);
    }
  });
  if (schemasByEndpointId.size === 0) return;

  const targetsByStepId = new Map();
  collectRoutineSteps(endpoint.routine).forEach((step) => {
    if (step.type !== 'CallApi') return;
    const endpointId = step.properties?.endpointId;
    if (type.isString(endpointId) && schemasByEndpointId.has(endpointId)) {
      targetsByStepId.set(step.stepId, schemasByEndpointId.get(endpointId));
    }
  });
  if (targetsByStepId.size === 0) return;

  traverseConfig({
    config: endpoint.routine,
    visitor: (obj) => {
      if (type.isUndefined(obj._step)) return;
      const path = extractOperatorPath({ operatorValue: obj._step });
      if (path === null) return;
      const [stepId, ...restSegments] = path.split('.');
      const target = targetsByStepId.get(stepId);
      if (type.isUndefined(target) || restSegments.length === 0) return;
      const rest = restSegments.join('.');
      const { resolved, declared, segment, candidates } = getSchemaAtPath({
        schema: target.responseSchema,
        path: rest,
        explain: true,
      });
      if (resolved) return;
      const suggestion = findSimilarString({ input: segment, candidates });
      collectExceptions(
        context,
        new ConfigError(
          `_step "${path}" reads "${rest}" from endpoint "${
            target.endpointId ?? target.id
          }", whose responseSchema does not declare it. Declared: ${declared.join(', ')}.` +
            (suggestion ? ` Did you mean "${suggestion}"?` : ''),
          { configKey: obj['~k'], checkSlug: 'response-schema' }
        )
      );
    },
  });
}

export default validateStepResponsePaths;
