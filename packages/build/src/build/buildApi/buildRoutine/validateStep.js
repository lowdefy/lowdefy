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

function validateStep(step, { endpointId }) {
  if (Object.keys(step).length === 0) {
    throw new Error(`Step is not defined at endpoint "${endpointId}"`);
  }
  if (type.isUndefined(step.id)) {
    throw new Error(`Step id missing at endpoint "${endpointId}".`);
  }
  if (!type.isString(step.id)) {
    throw new Error(
      `Step id is not a string at endpoint "${endpointId}". Received ${JSON.stringify(step.id)}.`
    );
  }
  if (step.id.includes('.')) {
    throw new Error(
      `Step id "${step.id}" at api "${endpointId}" should not include a period (".").`
    );
  }
  if (type.isNone(step.type)) {
    throw new Error(`Step type is not defined at "${step.id}" on endpoint "${endpointId}".`);
  }
  if (!type.isString(step.type)) {
    throw new Error(
      `Step type is not a string at "${
        step.id
      }" on endpoint "${endpointId}". Received ${JSON.stringify(step.type)}.`
    );
  }
  if (type.isUndefined(step.connectionId)) {
    throw new Error(`Step connectionId missing at endpoint "${endpointId}".`);
  }
  if (!type.isString(step.connectionId)) {
    throw new Error(
      `Step connectionId is not a string at endpoint "${endpointId}". Received ${JSON.stringify(
        step.connectionId
      )}.`
    );
  }
}

export default validateStep;
