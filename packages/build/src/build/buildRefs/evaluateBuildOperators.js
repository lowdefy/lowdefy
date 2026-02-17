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

import { BuildParser } from '@lowdefy/operators';
import operators from '@lowdefy/operators-js/operators/build';

import collectDynamicIdentifiers from '../collectDynamicIdentifiers.js';
import validateOperatorsDynamic from '../validateOperatorsDynamic.js';
import collectExceptions from '../../utils/collectExceptions.js';

// Validate and collect dynamic identifiers once at module load
validateOperatorsDynamic({ operators });
const dynamicIdentifiers = collectDynamicIdentifiers({ operators });

function evaluateBuildOperators({ context, input, refDef }) {
  const operatorsParser = new BuildParser({
    env: process.env,
    operators,
    dynamicIdentifiers,
  });

  const { output, errors } = operatorsParser.parse({
    input,
    operatorPrefix: '_build.',
  });
  if (errors.length > 0) {
    errors.forEach((error) => {
      // Resolve source file path for error location.
      // Two call sites: (1) recursiveBuild per-file where refDef.path is correct
      // but ~r isn't set yet (createRefReviver runs after), and (2) buildRefs
      // top-level where refDef is root lowdefy.yaml but ~r identifies the real
      // source file via refMap. The fallback to refDef.path handles case (1).
      error.filePath = error.refId ? context.refMap[error.refId]?.path : refDef.path;
      collectExceptions(context, error);
    });
  }
  return output;
}

export default evaluateBuildOperators;
