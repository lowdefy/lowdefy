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

function _switch({ params }) {
  if (!type.isArray(params.branches)) {
    throw new Error(`_switch takes an array type as input for the branches.`);
  }
  for (const branch of params.branches) {
    if (!type.isBoolean(branch.if)) {
      throw new Error(`_switch takes a boolean type for parameter "if".`);
    }
    if (branch.if === true) {
      return branch.then;
    }
  }
  return params.default;
}

_switch.dynamic = false;

export default _switch;
