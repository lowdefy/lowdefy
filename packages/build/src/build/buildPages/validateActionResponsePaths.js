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
import extractOperatorPath from '../../utils/extractOperatorPath.js';
import findSimilarString from '../../utils/findSimilarString.js';
import traverseConfig from '../../utils/traverseConfig.js';

// A CallAPI action's record is { type, response, index }, where response is the
// endpoint's :return value - so the endpoint result sits at
// _actions.<actionId>.response.<rest>. The record's siblings (type, index,
// error) are not the endpoint's and are left alone; the api record fields
// (status, success, responseTime, ...) are read through _api.<endpointId>.
// The pre-v8 double-envelope spelling is rewritten to this one, with a warning,
// by deprecateActionResponseEnvelope before this check runs.
function validateActionResponsePaths({ page, endpointConfigs, context }) {
  const schemasByEndpointId = new Map();
  endpointConfigs.forEach((config) => {
    if (type.isObject(config.responseSchema)) {
      schemasByEndpointId.set(config.endpointId ?? config.id, config);
    }
  });
  if (schemasByEndpointId.size === 0) return;

  const targetsByActionId = new Map();
  const actionRefs = [];
  traverseConfig({
    config: page,
    visitor: (obj) => {
      if (obj.type === 'CallAPI' && type.isString(obj.id)) {
        const endpointId = obj.params?.endpointId;
        if (type.isString(endpointId) && schemasByEndpointId.has(endpointId)) {
          targetsByActionId.set(obj.id, schemasByEndpointId.get(endpointId));
        }
      }
      if (!type.isUndefined(obj._actions)) {
        actionRefs.push(obj);
      }
    },
  });
  if (targetsByActionId.size === 0) return;

  actionRefs.forEach((obj) => {
    const path = extractOperatorPath({ operatorValue: obj._actions });
    if (path === null) return;
    const [actionId, record, ...restSegments] = path.split('.');
    const target = targetsByActionId.get(actionId);
    if (type.isUndefined(target)) return;
    if (record !== 'response' || restSegments.length === 0) return;
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
        `_actions "${path}" reads "${rest}" from endpoint "${
          target.endpointId ?? target.id
        }", whose responseSchema does not declare it. Declared: ${declared.join(', ')}.` +
          (suggestion ? ` Did you mean "${suggestion}"?` : ''),
        { configKey: obj['~k'], checkSlug: 'response-schema' }
      )
    );
  });
}

export default validateActionResponsePaths;
