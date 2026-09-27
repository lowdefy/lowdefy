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
import { getKeyOperator } from '@lowdefy/operators';

// One extra leading underscore defers operator evaluation by one level — the
// same convention _function bodies use for __args. Shared operators like
// _state are registered on the server, so a plain `_state` in a routine's
// :return evaluates there (against empty routine state). Authors write
// `__state` instead: it survives the server evaluation untouched, and this
// unescape strips one underscore so the client evaluates the real operator.
//
// Only the key of an operator-shaped object that names a client operator is
// unescaped. Data read into the :return cannot carry operators (the parser
// rejects them under literalData), so every such object here was written by
// the developer, and data keys like `__typename` pass through unchanged.
function unescapeOperators({ value, operators }) {
  if (type.isArray(value)) {
    return value.map((item) => unescapeOperators({ value: item, operators }));
  }
  if (!type.isObject(value)) {
    return value;
  }
  const keys = Object.keys(value).filter((key) => !key.startsWith('~'));
  const isOperator = keys.length === 1 && getKeyOperator({ key: keys[0], operators }) !== null;
  const result = {};
  Object.keys(value).forEach((key) => {
    const unescapedKey = isOperator && key.startsWith('__') ? key.slice(1) : key;
    result[unescapedKey] = unescapeOperators({ value: value[key], operators });
  });
  return result;
}

export default unescapeOperators;
