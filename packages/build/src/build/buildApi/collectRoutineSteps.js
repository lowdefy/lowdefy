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

// Every step of a routine, including those nested in control structures
// (:then, :else, :try, :catch, :do, ...). Runs after buildRoutine, so a step is
// any object carrying a stepId.
function collectRoutineSteps(routine, steps = []) {
  if (type.isArray(routine)) {
    routine.forEach((item) => collectRoutineSteps(item, steps));
    return steps;
  }
  if (type.isObject(routine)) {
    if (routine.stepId) {
      steps.push(routine);
    }
    Object.values(routine).forEach((value) => collectRoutineSteps(value, steps));
  }
  return steps;
}

export default collectRoutineSteps;
