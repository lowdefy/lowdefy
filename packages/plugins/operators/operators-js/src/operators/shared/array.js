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

import { type } from '@lowdefy/helpers';
import { runInstance } from '@lowdefy/operators';

const prep = (args) => {
  if (type.isNone(args[0])) {
    args[0] = [];
  }
  return args;
};

const meta = {
  concat: { prep, validTypes: ['array'] },
  copyWithin: {
    namedArgs: ['on', 'target', 'start', 'end'],
    prep,
    validTypes: ['array', 'object'],
  },
  every: {
    namedArgs: ['on', 'callback'],
    prep,
    validTypes: ['array', 'object'],
  },
  fill: {
    namedArgs: ['on', 'value', 'start', 'end'],
    prep,
    validTypes: ['array', 'object'],
  },
  filter: {
    namedArgs: ['on', 'callback'],
    prep,
    validTypes: ['array', 'object'],
  },
  find: {
    namedArgs: ['on', 'callback'],
    prep,
    validTypes: ['array', 'object'],
  },
  findIndex: {
    namedArgs: ['on', 'callback'],
    prep,
    validTypes: ['array', 'object'],
  },
  flat: { namedArgs: ['on', 'depth'], prep, validTypes: ['array', 'object'] },
  includes: { namedArgs: ['on', 'value'], prep, validTypes: ['array', 'object'] },
  indexOf: { namedArgs: ['on', 'value'], prep, validTypes: ['array', 'object'] },
  join: { namedArgs: ['on', 'separator'], prep, validTypes: ['array', 'object'] },
  lastIndexOf: { namedArgs: ['on', 'value'], prep, validTypes: ['array', 'object'] },
  map: {
    namedArgs: ['on', 'callback'],
    prep,
    validTypes: ['array', 'object'],
  },
  reduce: {
    namedArgs: ['on', 'callback', 'initialValue'],
    prep,
    validTypes: ['array', 'object'],
  },
  reduceRight: {
    namedArgs: ['on', 'callback', 'initialValue'],
    prep,
    validTypes: ['array', 'object'],
  },
  reverse: { prep, validTypes: ['array', 'null'], singleArg: true },
  slice: { namedArgs: ['on', 'start', 'end'], prep, validTypes: ['array', 'object'] },
  some: {
    namedArgs: ['on', 'callback'],
    prep,
    validTypes: ['array', 'object'],
  },
  sort: { namedArgs: ['on'], prep, validTypes: ['array'] },
  splice: {
    namedArgs: ['on', 'start', 'deleteCount'],
    spreadArgs: 'insert',
    returnInstance: true,
    prep,
    validTypes: ['array', 'object'],
  },
  length: { validTypes: ['array', 'null'], prep, property: true },
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
