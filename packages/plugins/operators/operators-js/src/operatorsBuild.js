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

import _and from './operators/shared/and.js';
import _args from './operators/shared/args.js';
import _array from './operators/shared/array.js';
import _date from './operators/shared/date.js';
import _divide from './operators/shared/divide.js';
import _eq from './operators/shared/eq.js';
import _function from './operators/shared/function.js';
import _get from './operators/shared/get.js';
import _gt from './operators/shared/gt.js';
import _gte from './operators/shared/gte.js';
import _if_none from './operators/shared/if_none.js';
import _if from './operators/shared/if.js';
import _intl from './operators/shared/intl.js';
import _json from './operators/shared/json.js';
import _log from './operators/shared/log.js';
import _lt from './operators/shared/lt.js';
import _lte from './operators/shared/lte.js';
import _math from './operators/shared/math.js';
import _ne from './operators/shared/ne.js';
import _not from './operators/shared/not.js';
import _number from './operators/shared/number.js';
import _object from './operators/shared/object.js';
import _operator from './operators/shared/operator.js';
import _or from './operators/shared/or.js';
import _product from './operators/shared/product.js';
import _random from './operators/shared/random.js';
import _regex from './operators/shared/regex.js';
import _string from './operators/shared/string.js';
import _subtract from './operators/shared/subtract.js';
import _sum from './operators/shared/sum.js';
import _switch from './operators/shared/switch.js';
import _type from './operators/shared/type.js';
import _uri from './operators/shared/uri.js';

import _base64 from './operators/server/base64.js';
import _hash from './operators/server/hash.js';

import _env from './operators/build/env.js';

export default {
  _and,
  _args,
  _array,
  _base64,
  _date,
  _divide,
  _env,
  _eq,
  _function,
  _get,
  _gt,
  _gte,
  _hash,
  _if_none,
  _if,
  _intl,
  _json,
  _log,
  _lt,
  _lte,
  _math,
  _ne,
  _not,
  _number,
  _object,
  _operator,
  _or,
  _product,
  _random,
  _regex,
  _string,
  _subtract,
  _sum,
  _switch,
  _type,
  _uri,
};
