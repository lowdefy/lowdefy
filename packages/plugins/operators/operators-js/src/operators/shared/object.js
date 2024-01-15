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
import { runClass, runInstance } from '@lowdefy/operators';

const prep = (args) => {
  if (type.isNone(args[0])) {
    args[0] = {};
  }
  return args;
};

const prepArray = (args) => {
  if (type.isNone(args[0])) {
    args[0] = [];
  }
  return args;
};

const prepDescriptor = (args) => {
  const descriptor = args[2] || {};
  if (type.isNone(descriptor.enumerable)) {
    descriptor.enumerable = true;
  }
  if (type.isNone(descriptor.configurable)) {
    descriptor.configurable = true;
  }
  args[2] = descriptor;
  if (type.isNone(args[0])) {
    args[0] = {};
  }
  return args;
};

const metaInstance = {
  hasOwnProperty: { namedArgs: ['on', 'prop'], validTypes: ['array', 'object'], prep },
};

const metaClass = {
  assign: { spreadArgs: true, validTypes: ['array'], prep },
  defineProperty: {
    namedArgs: ['on', 'key', 'descriptor'],
    validTypes: ['array', 'object'],
    prep: prepDescriptor,
  },
  entries: { singleArg: true, validTypes: ['object', 'null'], prep },
  fromEntries: { singleArg: true, validTypes: ['array', 'null'], prep: prepArray },
  keys: { singleArg: true, validTypes: ['object', 'null'], prep },
  values: { singleArg: true, validTypes: ['object', 'null'], prep },
};

function _object({ params, location, methodName }) {
  if (methodName === 'hasOwnProperty') {
    return runInstance({
      location,
      meta: metaInstance,
      methodName,
      operator: '_object',
      params,
      instanceType: 'object',
    });
  }
  return runClass({
    functions: Object,
    location,
    meta: metaClass,
    methodName,
    operator: '_object',
    params,
  });
}

export default _object;
