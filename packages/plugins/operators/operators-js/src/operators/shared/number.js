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

import { runClass, runInstance } from '@lowdefy/operators';

const meta = {
  EPSILON: { property: true },
  MAX_SAFE_INTEGER: { property: true },
  MAX_VALUE: { property: true },
  MIN_SAFE_INTEGER: { property: true },
  MIN_VALUE: { property: true },
  NaN: { property: true },
  NEGATIVE_INFINITY: { property: true },
  POSITIVE_INFINITY: { property: true },
  isFinite: { singleArg: true },
  isInteger: { singleArg: true },
  isNaN: { singleArg: true },
  isSafeInteger: { singleArg: true },
  parseFloat: { singleArg: true, validTypes: ['string'] },
  parseInt: { namedArgs: ['on', 'radix'], validTypes: ['array', 'object'] },
  toExponential: { namedArgs: ['on', 'fractionDigits'], validTypes: ['array', 'object'] },
  toFixed: { namedArgs: ['on', 'digits'], validTypes: ['array', 'object'] },
  toLocaleString: { namedArgs: ['on', 'locales'], validTypes: ['array', 'object'] },
  toPrecision: { namedArgs: ['on', 'precision'], validTypes: ['array', 'object'] },
  toString: { namedArgs: ['on', 'radix'], validTypes: ['array', 'object'] },
};

function _number({ params, location, methodName }) {
  if (
    ['toExponential', 'toFixed', 'toLocaleString', 'toPrecision', 'toString'].includes(methodName)
  ) {
    return runInstance({
      location,
      meta,
      methodName,
      operator: '_number',
      params,
      instanceType: 'number',
    });
  }
  return runClass({
    functions: Number,
    location,
    meta,
    methodName,
    operator: '_number',
    params,
  });
}

export default _number;
