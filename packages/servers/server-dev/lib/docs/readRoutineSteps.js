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

function isStep(node) {
  return type.isObject(node) && type.isString(node.type) && type.isString(node.stepId);
}

// Every step of an endpoint routine, at any depth: steps sit in arrays, and
// control objects (`:if`, `:try`, `:parallel`, ...) hold more arrays of steps
// under their `:` keys. A step's own properties are data, never more steps.
function readRoutineSteps({ routine }) {
  const steps = [];
  function walk(node) {
    if (type.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (isStep(node)) {
      steps.push(node);
      return;
    }
    if (type.isObject(node)) {
      Object.keys(node)
        .filter((key) => key.startsWith(':'))
        .forEach((key) => walk(node[key]));
    }
  }
  walk(routine ?? []);
  return steps;
}

export default readRoutineSteps;
