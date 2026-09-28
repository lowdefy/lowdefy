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

// Whether an edit changed nothing, so no event fires and no write happens. Empty values (null,
// undefined, '') are one value: opening and closing an editor on an empty cell is not an edit.
function valuesEqual(a, b) {
  const aEmpty = type.isNone(a) || a === '';
  const bEmpty = type.isNone(b) || b === '';
  if (aEmpty || bEmpty) return aEmpty && bEmpty;
  if (type.isDate(a) || type.isDate(b)) {
    return type.isDate(a) && type.isDate(b) && a.getTime() === b.getTime();
  }
  if (type.isArray(a) || type.isArray(b)) {
    return (
      type.isArray(a) &&
      type.isArray(b) &&
      a.length === b.length &&
      a.every((item, i) => valuesEqual(item, b[i]))
    );
  }
  if (type.isObject(a) || type.isObject(b)) return JSON.stringify(a) === JSON.stringify(b);
  return a === b;
}

export default valuesEqual;
