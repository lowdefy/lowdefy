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

// Marks each object in a copy whose counterpart, at the same position in the
// value it was copied from, is marked as data.
function transferDataMarks({ literalData, from, to }) {
  if (type.isArray(from) && type.isArray(to)) {
    for (let index = 0; index < to.length; index += 1) {
      transferDataMarks({ literalData, from: from[index], to: to[index] });
    }
    return;
  }
  if (!type.isObject(from) || !type.isObject(to)) {
    return;
  }
  const origin = literalData.dataObjects.get(from);
  if (!type.isUndefined(origin)) {
    literalData.dataObjects.set(to, origin);
  }
  for (const key of Object.keys(to)) {
    transferDataMarks({ literalData, from: from[key], to: to[key] });
  }
}

export default transferDataMarks;
