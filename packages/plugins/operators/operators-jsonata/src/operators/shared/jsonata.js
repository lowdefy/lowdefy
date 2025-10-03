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

import jsonata from 'jsonata';
import { type } from '@lowdefy/helpers';

import { runClass } from '@lowdefy/operators';

function evaluate(data, expression, bindings) {
  if (data === null) {
    data = {};
  }
  if (!type.isString(expression)) {
    throw new Error('Expression must be a string.');
  }
  try {
    const expr = jsonata(expression);
    let evalData = data;
    if (bindings && type.isObject(bindings)) {
      evalData = { ...data, ...bindings };
    }
    const result = expr.evaluate(evalData);
    // JSONata may add a 'sequence' property to arrays, convert to plain arrays
    if (type.isArray(result) && result.sequence === true) {
      return Array.from(result);
    }
    return result;
  } catch (error) {
    throw new Error(`JSONata evaluation error: ${error.message}`);
  }
}

function transform(data, expression, bindings) {
  return evaluate(data, expression, bindings);
}

const meta = {
  evaluate: { namedArgs: ['on', 'expr', 'bindings'], validTypes: ['array', 'object', 'string'] },
  transform: { namedArgs: ['on', 'expr', 'bindings'], validTypes: ['array', 'object', 'string'] },
};

const functions = { evaluate, transform };

function _jsonata({ params, location, methodName }) {
  return runClass({
    functions,
    location,
    meta,
    methodName,
    operator: '_jsonata',
    params,
  });
}

export default _jsonata;
