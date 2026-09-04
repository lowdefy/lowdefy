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

import { serializer, type, unset } from '@lowdefy/helpers';

// Deletes one ignored path from a state object. `$` stands for every index of
// the array at that position (the same wildcard `applyArrayIndices` resolves
// for block fields), so `rows.$.score` clears `score` from every row.
function deletePath(value, segments) {
  if (segments.length === 0 || type.isNone(value)) {
    return;
  }
  const [head, ...rest] = segments;
  if (head === '$') {
    if (type.isArray(value)) {
      value.forEach((item, index) => {
        if (rest.length === 0) {
          value[index] = undefined;
          return;
        }
        deletePath(item, rest);
      });
    }
    return;
  }
  if (rest.length === 0) {
    if (type.isArray(value)) {
      value[Number(head)] = undefined;
      return;
    }
    if (type.isObject(value)) {
      unset(value, head);
    }
    return;
  }
  if (type.isObject(value) || type.isArray(value)) {
    deletePath(value[head], rest);
  }
}

// applyIgnore returns a copy of a state object with the ignored paths removed.
// Both the golden written to disk and the freshly captured state go through it,
// and both end on the same JSON round trip: an ignored array element leaves a
// hole that JSON writes as `null`, so a side that skipped the round trip would
// compare `undefined` against a golden `null` and drift on every run.
function applyIgnore({ state, ignore = [] }) {
  const copy = serializer.copy(state) ?? {};
  ignore.forEach((ignorePath) => {
    deletePath(copy, ignorePath.split('.'));
  });
  return JSON.parse(JSON.stringify(copy));
}

export default applyIgnore;
