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

import { ConfigWarning } from '@lowdefy/errors';
import { BuildParser } from '@lowdefy/operators';
import operators from '@lowdefy/operators-js/operators/build';

import collectDynamicIdentifiers from '../collectDynamicIdentifiers.js';
import validateOperatorsDynamic from '../validateOperatorsDynamic.js';

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
    location: refDef.path ?? refDef.resolver,
    operatorPrefix: '_build.',
  });
  if (errors.length > 0) {
    errors.forEach((error) => {
      context.handleWarning(
        new ConfigWarning({
          message: error.message,
          received: error.received,
          filePath: refDef.path,
          lineNumber: error.lineNumber,
        })
      );
    });
  }
  return output;
}

export default evaluateBuildOperators;
