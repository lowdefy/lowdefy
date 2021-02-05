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

import runInstance from '../runInstance';

const meta = {
  concat: { validTypes: ['array'] },
  copyWithin: {
    namedArgs: ['on', 'target', 'start', 'end'],
    validTypes: ['array', 'object'],
  },
  every: {
    namedArgs: ['on', 'callback'],
    validTypes: ['array', 'object'],
  },
  fill: {
    namedArgs: ['on', 'value', 'start', 'end'],
    validTypes: ['array', 'object'],
  },
  filter: {
    namedArgs: ['on', 'callback'],
    validTypes: ['array', 'object'],
  },
  find: {
    namedArgs: ['on', 'callback'],
    validTypes: ['array', 'object'],
  },
  findIndex: {
    namedArgs: ['on', 'callback'],
    validTypes: ['array', 'object'],
  },
  flat: { namedArgs: ['on', 'depth'], validTypes: ['array', 'object'] },
  includes: { namedArgs: ['on', 'value'], validTypes: ['array', 'object'] },
  indexOf: { namedArgs: ['on', 'value'], validTypes: ['array', 'object'] },
  join: { namedArgs: ['on', 'separator'], validTypes: ['array', 'object'] },
  lastIndexOf: { namedArgs: ['on', 'value'], validTypes: ['array', 'object'] },
  map: {
    namedArgs: ['on', 'callback'],
    validTypes: ['array', 'object'],
  },
  reduce: {
    namedArgs: ['on', 'callback', 'initialValue'],
    validTypes: ['array', 'object'],
  },
  reduceRight: {
    namedArgs: ['on', 'callback', 'initialValue'],
    validTypes: ['array', 'object'],
  },
  reverse: { validTypes: ['array'], singleArg: true },
  slice: { namedArgs: ['on', 'start', 'end'], validTypes: ['array', 'object'] },
  some: {
    namedArgs: ['on', 'callback'],
    validTypes: ['array', 'object'],
  },
  sort: { namedArgs: ['on'], validTypes: ['array'] },
  splice: {
    namedArgs: ['on', 'start', 'deleteCount'],
    spreadArgs: 'insert',
    returnInstance: true,
    validTypes: ['array', 'object'],
  },
  length: { validTypes: ['array'], property: true },
  // some,
  // forEach,
  // pop: { namedArgs: ['on'] },
  // push: { namedArgs: ['on'] },
  // shift: { namedArgs: ['on'] },
  // toString,
  // unshift: { namedArgs: ['on'] },
};

function _array({ params, location, methodName }) {
  return runInstance({
    location,
    meta,
    methodName,
    operator: '_array',
    params,
    instanceType: 'array',
  });
}

export default _array;
