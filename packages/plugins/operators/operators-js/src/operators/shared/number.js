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
  EPSILON: { property: true , dynamic: false},
  MAX_SAFE_INTEGER: { property: true , dynamic: false},
  MAX_VALUE: { property: true , dynamic: false},
  MIN_SAFE_INTEGER: { property: true , dynamic: false},
  MIN_VALUE: { property: true , dynamic: false},
  NaN: { property: true , dynamic: false},
  NEGATIVE_INFINITY: { property: true , dynamic: false},
  POSITIVE_INFINITY: { property: true , dynamic: false},
  isFinite: { singleArg: true , dynamic: false},
  isInteger: { singleArg: true , dynamic: false},
  isNaN: { singleArg: true , dynamic: false},
  isSafeInteger: { singleArg: true , dynamic: false},
  parseFloat: { singleArg: true, validTypes: ['string'] , dynamic: false},
  parseInt: { namedArgs: ['on', 'radix'], validTypes: ['array', 'object'] , dynamic: false},
  toExponential: { namedArgs: ['on', 'fractionDigits'], validTypes: ['array', 'object'] , dynamic: false},
  toFixed: { namedArgs: ['on', 'digits'], validTypes: ['array', 'object'] , dynamic: false},
  toLocaleString: { namedArgs: ['on', 'locales'], validTypes: ['array', 'object'] , dynamic: false},
  toPrecision: { namedArgs: ['on', 'precision'], validTypes: ['array', 'object'] , dynamic: false},
  toString: { namedArgs: ['on', 'radix'], validTypes: ['array', 'object'] , dynamic: false},
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

_number.dynamic = false;

export default _number;
