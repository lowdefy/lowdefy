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
import runInstance from '../runInstance';
import runClass from '../runClass';

const allowedInstanceMethods = new Set(['hasOwnProperty']);
const allowedMethods = new Set(['keys', 'values', 'hasOwnProperty']);

function _object({ params, location, method }) {
  if (!type.isArray(params) || !type.isObject(params[0])) {
    throw new Error(
      `Operator Error: _object takes an array with the first argument as an object on which to evaluate "${method}". Received: {"_object.${method}":${JSON.stringify(
        params
      )}} at ${location}.`
    );
  }
  if (allowedInstanceMethods.has(method)) {
    return runInstance({
      allowedMethods: allowedInstanceMethods,
      allowedProperties: new Set(),
      location,
      method,
      operator: '_object',
      params,
    });
  }
  return runClass({
    allowedMethods,
    allowedProperties: new Set(),
    location,
    Cls: Object,
    method,
    operator: '_object',
    params,
  });
}

export default _object;
