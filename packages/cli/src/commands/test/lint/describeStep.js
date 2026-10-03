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
import { getStepKey } from '@lowdefy/node-utils';

function targetLabel(target) {
  if (type.isString(target)) {
    return ` "${target}"`;
  }
  if (!type.isObject(target)) {
    return '';
  }
  const label = target.blockId ?? target.text ?? target.containing;
  return type.isString(label) ? ` "${label}"` : '';
}

// `step 3 (click "assign_submit")`, as a lint message names a step.
function describeStep({ step, index }) {
  const key = getStepKey(step);
  switch (key) {
    case 'wait':
    case 'expect':
      return `step ${index} (${key}: { ${getStepKey(step[key])} })`;
    case 'goto':
      return `step ${index} (goto "${type.isString(step.goto) ? step.goto : step.goto?.pageId}")`;
    case 'press':
      return `step ${index} (press "${step.press}")`;
    default:
      return `step ${index} (${key}${targetLabel(step[key])})`;
  }
}

export default describeStep;
