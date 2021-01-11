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
  'charAt',
  'charCodeAt',
  'concat',
  'endsWith',
  'includes',
  'indexOf',
  'lastIndexOf',
  'localeCompare',
  'match',
  // 'matchAll',
  'normalize',
  'padEnd',
  'padStart',
  'repeat',
  'replace',
  // 'replaceAll',
  'search',
  'slice',
  'split',
  'startsWith',
  'substring',
  'toLocaleLowerCase',
  'toLocaleUpperCase',
  'toLowerCase',
  'toUpperCase',
  'trim',
  'trimEnd',
  'trimStart',
];

function _string({ params, location, method }) {
  if (!type.isArray(params) || !type.isString(params[0])) {
    throw new Error(
      `Operator Error: _string takes an array with the first argument as a string on which to evaluate "${method}". Received: {"_string.${method}":${JSON.stringify(
        params
      )}} at ${location}.`
    );
  }
  return runInstance({
    allowedMethods,
    allowedProperties,
    location,
    method,
    operator: '_string',
    params,
  });
}

export default _string;
