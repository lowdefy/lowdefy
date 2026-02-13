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
import { ConfigError } from '@lowdefy/errors/build';

function validateStep(step, { endpointId, context }) {
  const configKey = step['~k'];
  if (Object.keys(step).length === 0) {
    throw new ConfigError({
      message: `Step is not defined at endpoint "${endpointId}".`,
      configKey,
      context,
    });
  }
  if (type.isUndefined(step.id)) {
    throw new ConfigError({
      message: `Step id missing at endpoint "${endpointId}".`,
      configKey,
      context,
    });
  }
  if (!type.isString(step.id)) {
    throw new ConfigError({
      message: `Step id is not a string at endpoint "${endpointId}".`,
      received: step.id,
      configKey,
      context,
    });
  }
  if (step.id.includes('.')) {
    throw new ConfigError({
      message: `Step id "${step.id}" at endpoint "${endpointId}" should not include a period (".").`,
      configKey,
      context,
    });
  }
  if (type.isNone(step.type)) {
    throw new ConfigError({
      message: `Step type is not defined at "${step.id}" on endpoint "${endpointId}".`,
      configKey,
      context,
    });
  }
  if (!type.isString(step.type)) {
    throw new ConfigError({
      message: `Step type is not a string at "${step.id}" on endpoint "${endpointId}".`,
      received: step.type,
      configKey,
      context,
    });
  }
  if (type.isUndefined(step.connectionId)) {
    throw new ConfigError({
      message: `Step connectionId missing at endpoint "${endpointId}".`,
      configKey,
      context,
    });
  }
  if (!type.isString(step.connectionId)) {
    throw new ConfigError({
      message: `Step connectionId is not a string at endpoint "${endpointId}".`,
      received: step.connectionId,
      configKey,
      context,
    });
  }
}

export default validateStep;
