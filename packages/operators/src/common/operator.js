/*
  Copyright 2020 Lowdefy, Inc

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
  const { operations, params, location } = options;
  if (!type.isString(params.name)) {
    throw new Error(
      `Operator Error: _operator.name must be a valid operator name as string. Received: ${JSON.stringify(
        params
      )} at ${location}.`
    );
  }
  if (params.name === '_operator') {
    throw new Error(
      `Operator Error: _operator.name cannot be set to _operator to infinite avoid loop reference. Received: ${JSON.stringify(
        params
      )} at ${location}.`
    );
  }
  const [operator, method] = params.name.split('.');
  if (Object.prototype.hasOwnProperty.call(operations, operator)) {
    return operations[operator]({
      ...options,
      location,
      params: params && params.params,
      method,
    });
  }
  throw new Error(
    `Operator Error: _operator - Invalid operator name. Received: ${JSON.stringify(
      params
    )} at ${location}.`
  );
}

export default _operator;
