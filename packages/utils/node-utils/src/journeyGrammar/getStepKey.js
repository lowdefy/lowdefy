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

// Every step, wait and expect in the grammar is an object with exactly one
// key naming the verb; returns that key, or undefined when the object does not
// have exactly one.
function getStepKey(step) {
  if (!type.isObject(step)) {
    return undefined;
  }
  const keys = Object.keys(step);
  if (keys.length !== 1) {
    return undefined;
  }
  return keys[0];
}

export default getStepKey;
