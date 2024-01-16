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

async function evaluateBuildOperators({ context, input, refDef }) {
  const operatorsParser = new BuildParser({
    env: process.env,
    operators,
  });

  const { output, errors } = operatorsParser.parse({
    input,
    location: refDef.path ?? refDef.resolver,
    operatorPrefix: '_build.',
  });
  if (errors.length > 0) {
    await context.logger.warn('Build operator errors.');
    const promises = errors.map((error) => context.logger.warn(error.message));
    await promises;
  }
  return output;
}

export default evaluateBuildOperators;
