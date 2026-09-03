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

// The full dotted path an operator reference reads, for both forms:
// `_state: 'user.name'` and `_state: { key: 'user.name' }`. Null when the
// value is not a path (an `all: true` read, or an operator computing the key).
function extractOperatorPath({ operatorValue }) {
  if (type.isString(operatorValue)) {
    return operatorValue === '' ? null : operatorValue;
  }
  if (type.isObject(operatorValue)) {
    const path = operatorValue.key ?? operatorValue.path;
    return type.isString(path) && path !== '' ? path : null;
  }
  return null;
}

export default extractOperatorPath;
