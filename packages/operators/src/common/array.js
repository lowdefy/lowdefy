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

const allowedProperties = ['length'];
const allowedMethods = [
  'concat',
  'copyWithin',
  // 'every',
  'fill',
  // 'filter',
  // 'find',
  // 'findIndex',
  'flat',
  // 'forEach',
  'includes',
  'indexOf',
  'join',
  'lastIndexOf',
  // 'map',
  'pop',
  'push',
  // 'reduce',
  // 'reduceRight',
  'reverse',
  'shift',
  'slice',
  // 'some',
  'sort',
  'splice',
  'toString',
  'unshift',
];
const instanceReturnType = ['pop', 'push', 'shift', 'splice', 'unshift'];

function _array({ params, location, method }) {
  if (!type.isArray(params) || !type.isArray(params[0])) {
    throw new Error(
      `Operator Error: _array takes an array with the first argument as an array on which to evaluate "${method}". Received: {"_array.${method}":${JSON.stringify(
        params
      )}} at ${location}.`
    );
  }
  if (instanceReturnType.includes(method)) {
    runInstance({
      allowedMethods,
      allowedProperties,
      location,
      method,
      operator: '_array',
      params,
    });
    return params[0];
  }
  return runInstance({
    allowedMethods,
    allowedProperties,
    location,
    method,
    operator: '_array',
    params,
  });
}

export default _array;
