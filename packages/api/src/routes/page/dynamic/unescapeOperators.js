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

// One extra leading underscore defers operator evaluation by one level — the
// same convention _function bodies use for __args. Shared operators like
// _state are registered on the server, so a plain `_state` in a routine's
// :return evaluates there (against empty routine state). Authors write
// `__state` instead: it survives the server evaluation untouched, and this
// unescape strips one underscore so the client evaluates the real operator.
function unescapeOperators(value) {
  if (type.isArray(value)) {
    return value.map(unescapeOperators);
  }
  if (!type.isObject(value)) {
    return value;
  }
  const result = {};
  Object.keys(value).forEach((key) => {
    const unescapedKey = key.startsWith('__') ? key.slice(1) : key;
    result[unescapedKey] = unescapeOperators(value[key]);
  });
  return result;
}

export default unescapeOperators;
