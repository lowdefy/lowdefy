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

function _operator(options) {
  const { operators, params, location } = options;
  if (!type.isString(params.name)) {
    throw new Error(`_operator.name must be a valid operator name as string.`);
  }
  if (params.name === '_operator') {
    throw new Error(`_operator.name cannot be set to _operator to avoid infinite loop reference.`);
  }
  if (params.name.includes('experimental')) {
    throw new Error(`Experimental operators cannot be used with _operator.`);
  }
  const [operator, methodName] = params.name.split('.');
  // A name read at runtime comes with the operators it may call (the build
  // requires the list and bundles exactly those). A listed operator allows
  // every method; a listed method allows only itself.
  if (!type.isNone(params.operators)) {
    if (!type.isArray(params.operators)) {
      throw new Error(`_operator.operators must be an array of operator names.`);
    }
    if (!params.operators.some((name) => name === operator || name === params.name)) {
      throw new Error(`_operator - "${params.name}" is not in _operator.operators.`);
    }
  }
  if (Object.prototype.hasOwnProperty.call(operators, operator)) {
    return operators[operator]({
      ...options,
      location,
      params: params?.params,
      methodName,
    });
  }
  throw new Error(`_operator - Invalid operator name.`);
}

_operator.dynamic = true;
// The operator it dispatches to is called through the tracked registry view, so it records itself.
_operator.tracking = { kind: 'pure' };

export default _operator;
