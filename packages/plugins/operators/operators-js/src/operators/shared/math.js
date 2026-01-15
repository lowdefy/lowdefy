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

import { runClass } from '@lowdefy/operators';

const meta = {
  abs: { singleArg: true, validTypes: ['number'], dynamic: false },
  acos: { singleArg: true, validTypes: ['number'], dynamic: false },
  acosh: { singleArg: true, validTypes: ['number'], dynamic: false },
  asin: { singleArg: true, validTypes: ['number'], dynamic: false },
  asinh: { singleArg: true, validTypes: ['number'], dynamic: false },
  atan: { singleArg: true, validTypes: ['number'], dynamic: false },
  atan2: { namedArgs: ['x', 'y'], validTypes: ['object', 'array'], dynamic: false },
  atanh: { singleArg: true, validTypes: ['number'], dynamic: false },
  cbrt: { singleArg: true, validTypes: ['number'], dynamic: false },
  ceil: { singleArg: true, validTypes: ['number'], dynamic: false },
  clz32: { singleArg: true, validTypes: ['number'], dynamic: false },
  cos: { singleArg: true, validTypes: ['number'], dynamic: false },
  cosh: { singleArg: true, validTypes: ['number'], dynamic: false },
  exp: { singleArg: true, validTypes: ['number'], dynamic: false },
  expm1: { singleArg: true, validTypes: ['number'], dynamic: false },
  floor: { singleArg: true, validTypes: ['number'], dynamic: false },
  fround: { singleArg: true, validTypes: ['number'], dynamic: false },
  hypot: { spreadArgs: true, validTypes: ['array'], dynamic: false },
  imul: { namedArgs: ['a', 'b'], validTypes: ['object', 'array'], dynamic: false },
  log: { singleArg: true, validTypes: ['number'], dynamic: false },
  log10: { singleArg: true, validTypes: ['number'], dynamic: false },
  log1p: { singleArg: true, validTypes: ['number'], dynamic: false },
  log2: { singleArg: true, validTypes: ['number'], dynamic: false },
  max: { spreadArgs: true, validTypes: ['array'], dynamic: false },
  min: { spreadArgs: true, validTypes: ['array'], dynamic: false },
  pow: { namedArgs: ['base', 'exponent'], validTypes: ['object', 'array'], dynamic: false },
  random: { noArgs: true, dynamic: true },
  round: { singleArg: true, validTypes: ['number'], dynamic: false },
  sign: { singleArg: true, validTypes: ['number'], dynamic: false },
  sin: { singleArg: true, validTypes: ['number'], dynamic: false },
  sinh: { singleArg: true, validTypes: ['number'], dynamic: false },
  sqrt: { singleArg: true, validTypes: ['number'], dynamic: false },
  tan: { singleArg: true, validTypes: ['number'], dynamic: false },
  tanh: { singleArg: true, validTypes: ['number'], dynamic: false },
  trunc: { singleArg: true, validTypes: ['number'], dynamic: false },
  E: { property: true, dynamic: false },
  LN10: { property: true, dynamic: false },
  LN2: { property: true, dynamic: false },
  LOG10E: { property: true, dynamic: false },
  LOG2E: { property: true, dynamic: false },
  PI: { property: true, dynamic: false },
  SQRT1_2: { property: true, dynamic: false },
  SQRT2: { property: true, dynamic: false },
};

function _math({ params, location, methodName }) {
  return runClass({
    functions: Math,
    location,
    meta,
    methodName,
    operator: '_math',
    params,
  });
}

_math.dynamic = false;

export default _math;
