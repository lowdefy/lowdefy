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

// JSON with object keys sorted, so two views that differ only in key order compare equal.
function stableStringify(value) {
  if (type.isArray(value)) {
    return `[${value.map((item) => stableStringify(item ?? null)).join(',')}]`;
  }
  if (type.isObject(value)) {
    const entries = Object.keys(value)
      .filter((key) => !type.isUndefined(value[key]))
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`);
    return `{${entries.join(',')}}`;
  }
  return JSON.stringify(value ?? null);
}

export default stableStringify;
