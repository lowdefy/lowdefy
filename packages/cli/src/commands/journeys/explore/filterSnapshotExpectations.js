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

function leaves(value) {
  if (type.isArray(value)) return value.flatMap(leaves);
  if (type.isObject(value)) return Object.values(value).flatMap(leaves);
  return [value];
}

function isSafeLeaf({ leaf, knownText }) {
  if (type.isBoolean(leaf) || leaf === null) return true;
  return type.isString(leaf) && knownText.has(leaf);
}

// On a data set with a snapshot, staging values must not land in a candidate:
// an expect.state step is kept only when every leaf of its equals value is a
// known-text string, a boolean or null. knownTextFor({ typed }) gives the
// known-text set with the values the journey typed before that step. Dropping
// an assertion authors nothing. Returns the journey and its step comments,
// re-indexed, and how many expectations were dropped.
function filterSnapshotExpectations({ journey, comments = new Map(), knownTextFor }) {
  const typed = [];
  const kept = [];
  const keptComments = new Map();
  let dropped = 0;
  journey.steps.forEach((step, index) => {
    if (!type.isUndefined(step.fill)) typed.push(String(step.fill.value));
    const state = step.expect?.state;
    if (!type.isUndefined(state)) {
      const knownText = knownTextFor({ typed: [...typed] });
      if (!leaves(state.equals).every((leaf) => isSafeLeaf({ leaf, knownText }))) {
        dropped += 1;
        return;
      }
    }
    if (comments.has(index)) keptComments.set(kept.length, comments.get(index));
    kept.push(step);
  });
  return { journey: { ...journey, steps: kept }, comments: keptComments, dropped };
}

export default filterSnapshotExpectations;
