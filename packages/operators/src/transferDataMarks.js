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
  const pending = [{ from, to }];
  while (pending.length > 0) {
    const pair = pending.pop();
    if (type.isArray(pair.from) && type.isArray(pair.to)) {
      pair.to.forEach((item, index) => pending.push({ from: pair.from[index], to: item }));
    } else if (type.isObject(pair.from) && type.isObject(pair.to)) {
      const origin = literalData.dataObjects.get(pair.from);
      if (!type.isUndefined(origin)) {
        literalData.dataObjects.set(pair.to, origin);
      }
      Object.keys(pair.to).forEach((key) =>
        pending.push({ from: pair.from[key], to: pair.to[key] })
      );
    }
  }
}

export default transferDataMarks;
