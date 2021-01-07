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

const properties = ['E', 'LN10', 'LN2', 'LOG10E', 'LOG2E', 'PI', 'SQRT1_2', 'SQRT2'];
const methods = [
  'abs',
  'acos',
  'acosh',
  'asin',
  'asinh',
  'atan',
  'atan2',
  'atanh',
  'cbrt',
  'ceil',
  'clz32',
  'cos',
  'cosh',
  'exp',
  'expm1',
  'floor',
  'fround',
  'hypot',
  'imul',
  'log',
  'log10',
  'log1p',
  'log2',
  'max',
  'min',
  'pow',
  'random',
  'round',
  'sign',
  'sinh',
  'sqrt',
  'tan',
  'tanh',
  'trunc',
];

function _math({ params, location }) {
  if (!type.isObject(params)) {
    throw new Error(
      `Operator Error: _math takes an object type as input. Received: ${JSON.stringify(
        params
      )} at ${location}.`
    );
  }
  if (params.property) {
    if (!type.isString(params.property) || !properties.includes(params.property)) {
      throw new Error(
        `Operator Error: _math.property takes can be one of 'E', 'LN10', 'LN2', 'LOG10E', 'LOG2E', 'PI', 'SQRT1_2' or 'SQRT2'. Received: ${JSON.stringify(
          params
        )} at ${location}.`
      );
    }
    return Math[params.property];
  }

  if (!type.isString(params.method) || !methods.includes(params.method)) {
    throw new Error(
      `Operator Error: _math.property takes can be one of 'abs', 'acos', 'acosh', 'asin', 'asinh', 'atan', 'atan2', 'atanh', 'cbrt', 'ceil', 'clz32', 'cos', 'cosh', 'exp', 'expm1', 'floor', 'fround', 'hypot', 'imul', 'log', 'log10', 'log1p', 'log2', 'max', 'min', 'pow', 'random', 'round', 'sign', 'sinh', 'sqrt', 'tan', 'tanh' or 'trunc'. Received: ${JSON.stringify(
        params
      )} at ${location}.`
    );
  }
  params.args = params.args || [];
  if (!type.isArray(params.args)) {
    throw new Error(
      `Operator Error: _math.args takes an array type as input. Received: ${JSON.stringify(
        params
      )} at ${location}.`
    );
  }
  return Math[params.method](...params.args);
}

export default _math;
