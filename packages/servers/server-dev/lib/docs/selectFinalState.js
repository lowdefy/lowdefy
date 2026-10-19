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

import { get, type } from '@lowdefy/helpers';

// The final state is returned whole when it is small. A page holding request
// results or long lists can hold hundreds of KB, more than an agent's context
// should take on every journey, so above this it is summarised instead.
const DEFAULT_STATE_LIMIT = 10_000;

function summariseState({ state, characters }) {
  const keys = Object.fromEntries(
    Object.entries(state)
      .map(([key, value]) => [key, (JSON.stringify(value) ?? '').length])
      .sort(([, a], [, b]) => b - a)
  );
  return {
    characters,
    keys,
    note: `The final state is ${characters} characters, over the ${DEFAULT_STATE_LIMIT} returned by default. keys lists each top-level key with its size. Pass state: ["path", ...] for the paths you need, or state: true for all of it.`,
  };
}

// Picks what the journey result carries of the final page state:
//   false          nothing
//   true           the whole state
//   [path, ...]    { [path]: value } for each path, null where it is undefined
//   undefined      the whole state when it is at most DEFAULT_STATE_LIMIT
//                  characters of JSON, otherwise `stateOmitted`, a summary of
//                  its size and top-level keys
// A state that could not be read ({ error }) is returned as is, since the
// error is what the caller needs to see.
function selectFinalState({ state, selection }) {
  if (selection === false) {
    return {};
  }
  if (selection === true || !type.isObject(state) || !type.isUndefined(state.error)) {
    return { state };
  }
  if (type.isArray(selection)) {
    return {
      state: Object.fromEntries(selection.map((path) => [path, get(state, path) ?? null])),
    };
  }
  const characters = JSON.stringify(state).length;
  if (characters <= DEFAULT_STATE_LIMIT) {
    return { state };
  }
  return { stateOmitted: summariseState({ state, characters }) };
}

export { DEFAULT_STATE_LIMIT };
export default selectFinalState;
