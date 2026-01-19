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

import { type } from '@lowdefy/helpers';

function validateOperatorsDynamic({ operators }) {
  const missingDynamic = [];

  Object.entries(operators).forEach(([operatorName, operatorFn]) => {
    if (!type.isFunction(operatorFn)) return;

    if (!type.isBoolean(operatorFn.dynamic)) {
      missingDynamic.push(operatorName);
    }
  });

  if (missingDynamic.length > 0) {
    throw new Error(
      `Operator validation failed: The following operators are missing the 'dynamic' property: ${missingDynamic.join(', ')}. ` +
        `All operators must have a 'dynamic' boolean property (true for runtime-only, false for build-time safe).`
    );
  }
}

export default validateOperatorsDynamic;
