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
  abs: { singleArg: true, validTypes: ['number'] },
  acos: { singleArg: true, validTypes: ['number'] },
  acosh: { singleArg: true, validTypes: ['number'] },
  asin: { singleArg: true, validTypes: ['number'] },
  asinh: { singleArg: true, validTypes: ['number'] },
  atan: { singleArg: true, validTypes: ['number'] },
  atan2: { namedArgs: ['x', 'y'], validTypes: ['object', 'array'] },
  atanh: { singleArg: true, validTypes: ['number'] },
  cbrt: { singleArg: true, validTypes: ['number'] },
  ceil: { singleArg: true, validTypes: ['number'] },
  clz32: { singleArg: true, validTypes: ['number'] },
  cos: { singleArg: true, validTypes: ['number'] },
  cosh: { singleArg: true, validTypes: ['number'] },
  exp: { singleArg: true, validTypes: ['number'] },
  expm1: { singleArg: true, validTypes: ['number'] },
  floor: { singleArg: true, validTypes: ['number'] },
  fround: { singleArg: true, validTypes: ['number'] },
  hypot: { spreadArgs: true, validTypes: ['array'] },
  imul: { namedArgs: ['a', 'b'], validTypes: ['object', 'array'] },
  log: { singleArg: true, validTypes: ['number'] },
  log10: { singleArg: true, validTypes: ['number'] },
  log1p: { singleArg: true, validTypes: ['number'] },
  log2: { singleArg: true, validTypes: ['number'] },
  max: { spreadArgs: true, validTypes: ['array'] },
  min: { spreadArgs: true, validTypes: ['array'] },
  pow: { namedArgs: ['base', 'exponent'], validTypes: ['object', 'array'] },
  random: { noArgs: true },
  round: { singleArg: true, validTypes: ['number'] },
  sign: { singleArg: true, validTypes: ['number'] },
  sin: { singleArg: true, validTypes: ['number'] },
  sinh: { singleArg: true, validTypes: ['number'] },
  sqrt: { singleArg: true, validTypes: ['number'] },
  tan: { singleArg: true, validTypes: ['number'] },
  tanh: { singleArg: true, validTypes: ['number'] },
  trunc: { singleArg: true, validTypes: ['number'] },
  E: { property: true },
  LN10: { property: true },
  LN2: { property: true },
  LOG10E: { property: true },
  LOG2E: { property: true },
  PI: { property: true },
  SQRT1_2: { property: true },
  SQRT2: { property: true },
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

export default _math;
