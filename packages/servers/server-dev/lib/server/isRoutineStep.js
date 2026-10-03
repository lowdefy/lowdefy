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

// A step of a built endpoint routine. The build gives every step a stepId
// (the id the config wrote; its id becomes the scoped endpoint:<id>:<step>),
// so a node with a string type and stepId is a step, and a control object
// (`:if`, `:try`, ...) or a step's own properties never is.
function isRoutineStep(node) {
  return type.isObject(node) && type.isString(node.type) && type.isString(node.stepId);
}

export default isRoutineStep;
