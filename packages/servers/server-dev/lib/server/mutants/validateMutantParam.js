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

import operators from './operators/index.js';

const ARTIFACT_PATTERN = /^(pages\/.+\.json|api\/.+\.json|events\.json)$/;

// The `mutant` of a journey POST: one mutant from POST /lowdefy-docs/mutants,
// with the build it was listed against. Returns an error message, or
// undefined when it is valid.
function validateMutantParam(mutant) {
  if (!type.isObject(mutant)) {
    return `The "mutant" param must be an object { buildId, artifact, key, arg, operator }. Received ${JSON.stringify(
      mutant
    )}.`;
  }
  if (
    !type.isString(mutant.artifact) ||
    !ARTIFACT_PATTERN.test(mutant.artifact) ||
    mutant.artifact.includes('..')
  ) {
    return `"mutant.artifact" must be a page, endpoint or app events artifact path, such as "pages/tickets.json". Received ${JSON.stringify(
      mutant.artifact
    )}.`;
  }
  if (type.isUndefined(operators[mutant.operator])) {
    return `"mutant.operator" must be one of ${Object.keys(operators).join(
      ', '
    )}. Received ${JSON.stringify(mutant.operator)}.`;
  }
  if (!type.isString(mutant.key)) {
    return `"mutant.key" must be a string. Received ${JSON.stringify(mutant.key)}.`;
  }
  if (!type.isNone(mutant.arg) && !type.isString(mutant.arg)) {
    return `"mutant.arg" must be a string. Received ${JSON.stringify(mutant.arg)}.`;
  }
  return undefined;
}

export default validateMutantParam;
