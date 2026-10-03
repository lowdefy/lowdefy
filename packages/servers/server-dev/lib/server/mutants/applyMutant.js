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

import findNodeByKey from './findNodeByKey.js';
import operators from './operators/index.js';

// Applies one mutant to a deserialised artifact copy, in place. Reports
// whether it applied, and why not when it did not, changing nothing then.
function applyMutant({ root, mutant: { operator, key, arg } }) {
  const definition = operators[operator];
  if (type.isUndefined(definition)) {
    return { applied: false, reason: `unknown operator "${operator}"` };
  }
  const found = findNodeByKey({ root, key });
  if (found === null) {
    return { applied: false, reason: 'key not found' };
  }
  return definition.apply({ ...found, arg });
}

export default applyMutant;
