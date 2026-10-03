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

// An action's identity is its candidate's kind and target, whatever value it
// was given.
function actionKey(candidate) {
  return JSON.stringify([candidate.kind, candidate.target]);
}

// The progress rules of one (page, role), keyed by the state shape. Within a
// walk, an action taken from a shape is not offered from it again, so a walk
// cannot cycle. Across walks, actions an earlier walk took from a shape are
// tried: still offered, after the untried ones, so later walks reach
// something new without being shut out of a form an earlier walk filled.
function createWalkProgress() {
  const tried = new Map();
  let taken = new Map();
  let walkIndex = -1;

  function has(map, shape, candidate) {
    return map.get(shape)?.has(actionKey(candidate)) === true;
  }

  function startWalk() {
    taken.forEach((keys, shape) => {
      const triedKeys = tried.get(shape) ?? new Set();
      keys.forEach((key) => triedKeys.add(key));
      tried.set(shape, triedKeys);
    });
    taken = new Map();
    walkIndex += 1;
    return walkIndex;
  }

  function record({ shape, candidate }) {
    const keys = taken.get(shape) ?? new Set();
    keys.add(actionKey(candidate));
    taken.set(shape, keys);
  }

  return {
    isTaken: ({ shape, candidate }) => has(taken, shape, candidate),
    isTried: ({ shape, candidate }) => has(tried, shape, candidate),
    record,
    startWalk,
    walkIndex: () => walkIndex,
  };
}

export default createWalkProgress;
