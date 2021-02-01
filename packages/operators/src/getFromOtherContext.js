/*
  Copyright 2020-2021 Lowdefy, Inc

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

import { applyArrayIndices, get, type } from '@lowdefy/helpers';

const contextKeys = {
  _action_log: 'actionLog',
  _state: 'state',
  _input: 'input',
  _global: 'lowdefyGlobal',
  _request_details: 'requests',
  _mutation_details: 'mutations',
  _url_query: 'urlQuery',
};

function addListener({ context, targetContext }) {
  if (context.id === targetContext.id) {
    return;
  }
  targetContext.updateListeners.add(context.id);
}

function getFromOtherContext({ params, context, contexts, arrayIndices, operator, location }) {
  const { contextId } = params;
  if (!type.isString(contextId)) {
    throw new Error(
      `Operator Error: ${operator}.contextId must be of type string. Received: ${JSON.stringify(
        params
      )} at ${location}.`
    );
  }
  if (type.isUndefined(contextKeys[operator])) {
    throw new Error(
      `Operator Error: Cannot use ${operator} to get from another context. Received: ${JSON.stringify(
        params
      )} at ${location}.`
    );
  }
  const targetContext = contexts[contextId];
  if (!type.isObject(targetContext)) {
    throw new Error(
      `Operator Error: Context ${contextId} not found. Received: ${JSON.stringify(
        params
      )} at ${location}.`
    );
  }
  addListener({ context, targetContext });
  const object = targetContext[contextKeys[operator]];
  if (params.all === true) return object;
  if (type.isString(params.key)) {
    return get(object, applyArrayIndices(arrayIndices, params.key), {
      default: get(params, 'default', { default: null, copy: true }),
      copy: true,
    });
  }
  return object;
}

export default getFromOtherContext;
