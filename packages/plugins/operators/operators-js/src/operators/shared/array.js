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
import { runClass, runInstance } from '@lowdefy/operators';

const prep = (args) => {
  if (type.isNone(args[0])) {
    args[0] = [];
  }
  return args;
};

const meta = {
  at: { namedArgs: ['on', 'index'], prep, validTypes: ['array', 'object'] },
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
  findLast: {
    namedArgs: ['on', 'callback'],
    prep,
    validTypes: ['array', 'object'],
  },
  findLastIndex: {
    namedArgs: ['on', 'callback'],
    prep,
    validTypes: ['array', 'object'],
  },
  flat: { namedArgs: ['on', 'depth'], prep, validTypes: ['array', 'object'] },
  flatMap: {
    namedArgs: ['on', 'callback'],
    prep,
    validTypes: ['array', 'object'],
  },
  // Array.from is static; it builds a new array, e.g. of length n from { length: n }.
  from: { namedArgs: ['on', 'callback'], validTypes: ['array', 'object'] },
  includes: { namedArgs: ['on', 'value'], prep, validTypes: ['array', 'object'] },
  indexOf: { namedArgs: ['on', 'value'], prep, validTypes: ['array', 'object'] },
  join: { namedArgs: ['on', 'separator'], prep, validTypes: ['array', 'object'] },
  lastIndexOf: { namedArgs: ['on', 'value'], prep, validTypes: ['array', 'object'] },
  map: {
    namedArgs: ['on', 'callback'],
    prep,
    validTypes: ['array', 'object'],
  },
  // Methods that change the array in place return the changed array, like splice, since the
  // native return values (the new length, or the removed item) are rarely useful in config.
  pop: { prep, validTypes: ['array', 'null'], singleArg: true, returnInstance: true },
  push: {
    namedArgs: ['on'],
    spreadArgs: 'items',
    returnInstance: true,
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
  shift: { prep, validTypes: ['array', 'null'], singleArg: true, returnInstance: true },
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
  unshift: {
    namedArgs: ['on'],
    spreadArgs: 'items',
    returnInstance: true,
    prep,
    validTypes: ['array', 'object'],
  },
  length: { validTypes: ['array', 'null'], prep, property: true },
};

const functions = {
  from: (arrayLike, callback) => Array.from(arrayLike, callback),
};

function _array({ params, location, methodName }) {
  if (methodName === 'from') {
    return runClass({
      functions,
      location,
      meta,
      methodName,
      operator: '_array',
      params,
    });
  }
  return runInstance({
    location,
    meta,
    methodName,
    operator: '_array',
    params,
    instanceType: 'array',
  });
}

_array.dynamic = false;
_array.tracking = { kind: 'pure' };

export default _array;
