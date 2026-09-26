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

// A journey's `state` option: true, false, or an array of state paths.
// Returns an error message, or undefined when it is valid or not given.
function validateStateSelection({ state }) {
  if (type.isUndefined(state) || type.isBoolean(state)) {
    return undefined;
  }
  if (type.isArray(state) && state.every((path) => type.isString(path) && path !== '')) {
    return undefined;
  }
  return `The "state" option must be true, false or an array of state paths such as ["form.name"]. Received ${JSON.stringify(
    state
  )}.`;
}

export default validateStateSelection;
