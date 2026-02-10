/*
  Copyright 2020-2024 Lowdefy, Inc

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

import { ServerParser } from '@lowdefy/operators';
import { PluginError } from '@lowdefy/errors/server';

function createEvaluateOperators(context) {
  const { jsMap, operators, payload, secrets, state, steps, user } = context;

  const operatorsParser = new ServerParser({
    jsMap,
    operators,
    payload,
    secrets,
    state,
    steps,
    user,
  });
  function evaluateOperators({ input, items, location }) {
    const { output, errors } = operatorsParser.parse({
      input,
      items,
      location,
    });
    if (errors.length > 0) {
      const error = errors[0];
      // Extract operator name from received: { _if: params }
      const operatorName = error.received ? Object.keys(error.received)[0] : null;
      throw new PluginError({
        error,
        pluginType: 'operator',
        pluginName: operatorName,
        received: error.received,
        location: error.operatorLocation,
        configKey: error.configKey,
      });
    }

    return output;
  }

  return evaluateOperators;
}

export default createEvaluateOperators;
