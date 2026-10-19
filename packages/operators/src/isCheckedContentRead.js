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

// Under literalData, the one read whose result is config rather than data:
// `_step: <stepId>.blocks` of a ValidateDynamic step that passed with the
// resolving Dynamic block's policy. _step copies its value, so the mark is the
// read's params, not the object.
function isCheckedContentRead({ literalData, op, params }) {
  if (op !== '_step') {
    return false;
  }
  const path = type.isString(params) ? params : params?.key;
  if (!type.isString(path)) {
    return false;
  }
  const [stepId, field, ...rest] = path.split('.');
  return field === 'blocks' && rest.length === 0 && literalData.validatedStepIds.has(stepId);
}

export default isCheckedContentRead;
