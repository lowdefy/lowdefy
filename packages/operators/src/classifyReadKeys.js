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

import isStringArray from './isStringArray.js';

// The classification of a call to a read declaration: its keys, from a static array or a function of
// the call. Keys a declaration can not produce cost the block its tracking, never the evaluation.
function classifyReadKeys({ callInfo, callName, declaration }) {
  let keys;
  try {
    keys = typeof declaration.keys === 'function' ? declaration.keys(callInfo) : declaration.keys;
  } catch (error) {
    return {
      kind: 'untracked',
      keys: [],
      reason: `${callName} tracking keys threw: ${error.message}`,
    };
  }
  if (!isStringArray(keys)) {
    return {
      kind: 'untracked',
      keys: [],
      reason: `${callName} tracking keys are not an array of strings`,
    };
  }
  return {
    kind: 'read',
    keys,
    reason: callName,
    resultMayContainFunctions: declaration.resultMayContainFunctions === true,
  };
}

export default classifyReadKeys;
