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

const UNITS = new Set(['day', 'week', 'month', 'year']);

// A complete relative date, `{ last: n, unit }` or `{ next: n, unit }`: the value of `within`, and a
// value `before` and `after` may take in place of a fixed date.
function isRelativeDate(value) {
  if (!type.isObject(value) || !UNITS.has(value.unit)) return false;
  return type.isNumber(value.last) || type.isNumber(value.next);
}

export default isRelativeDate;
