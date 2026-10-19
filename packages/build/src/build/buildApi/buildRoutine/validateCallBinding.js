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
import { ConfigError } from '@lowdefy/errors';

// An object whose keys are all plain names is a literal; one with a key
// starting with "_" is an operator the server evaluates.
function isLiteralObject(value) {
  return (
    type.isObject(value) &&
    Object.keys(value)
      .filter((key) => !key.startsWith('~'))
      .every((key) => !key.startsWith('_'))
  );
}

function isStringOrOperator(value) {
  return (
    (type.isString(value) && value !== '') || (type.isObject(value) && !isLiteralObject(value))
  );
}

// The static half of a CallApi step's organization binding. Whether the
// calling run may bind (it must be a trusted system run) is known only at
// runtime, since the same endpoint can run from a schedule and from a
// signed-in caller.
function validateCallBinding({ step, endpointId, configKey }) {
  const { caller, organization } = step.properties;
  if (!type.isNone(caller) && type.isNone(organization)) {
    throw new ConfigError(
      `Endpoint step "${step.id}" at endpoint "${endpointId}" properties.caller requires properties.organization. A stand-in caller only runs inside an organization binding.`,
      { configKey }
    );
  }
  if (!type.isNone(organization) && !isStringOrOperator(organization)) {
    throw new ConfigError(
      `Endpoint step "${step.id}" at endpoint "${endpointId}" properties.organization should be a non-empty organization id string.`,
      { received: organization, configKey }
    );
  }
  if (type.isNone(caller)) {
    return;
  }
  if (!type.isObject(caller)) {
    throw new ConfigError(
      `Endpoint step "${step.id}" at endpoint "${endpointId}" properties.caller should be an object with non-empty string "id" and "name".`,
      { received: caller, configKey }
    );
  }
  if (!isLiteralObject(caller)) {
    return;
  }
  const keys = Object.keys(caller).filter((key) => !key.startsWith('~'));
  if (keys.length !== 2 || !isStringOrOperator(caller.id) || !isStringOrOperator(caller.name)) {
    throw new ConfigError(
      `Endpoint step "${step.id}" at endpoint "${endpointId}" properties.caller should be an object with non-empty string "id" and "name" and nothing else.`,
      { received: caller, configKey }
    );
  }
}

export default validateCallBinding;
