/*
  Copyright 2020-2024 Lowdefy, Inc

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
import collectTypeNames from '../collectTypeNames.js';
import validateOperatorsDynamic from '../validateOperatorsDynamic.js';

// Validate and collect dynamic identifiers once at module load
validateOperatorsDynamic({ operators });
const dynamicIdentifiers = collectDynamicIdentifiers({ operators });

function evaluateStaticOperators({ context, input, refDef }) {
  // Collect type names from context.typesMap for type boundary detection
  const typeNames = collectTypeNames({ typesMap: context.typesMap });

  const operatorsParser = new BuildParser({
    env: process.env,
    operators,
    dynamicIdentifiers,
    typeNames,
  });

  const location = refDef.path ?? refDef.resolver;
  const { output, errors } = operatorsParser.parse({
    input,
    location,
    operatorPrefix: '_',
  });

  if (errors.length > 0) {
    errors.forEach((error) => {
      context.logger.warn(`Static operator error at ${location}: ${error.message}`);
    });
  }

  return output;
}

export default evaluateStaticOperators;
