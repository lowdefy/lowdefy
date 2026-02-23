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

function validateEndpoint({ endpoint, index, checkDuplicateEndpointId }) {
  const configKey = endpoint['~k'];
  if (type.isUndefined(endpoint.id)) {
    throw new ConfigError(`Endpoint id missing at endpoint ${index}.`, { configKey });
  }
  if (!type.isString(endpoint.id)) {
    throw new ConfigError(`Endpoint id is not a string at endpoint ${index}.`, {
      received: endpoint.id,
      configKey,
    });
  }
  if (endpoint.id.includes('.')) {
    throw new ConfigError(`Endpoint id "${endpoint.id}" should not include a period (".").`, {
      configKey,
    });
  }
  if (type.isUndefined(endpoint.type)) {
    throw new ConfigError(`Endpoint type is not defined at "${endpoint.id}".`, { configKey });
  }
  if (!type.isString(endpoint.type)) {
    throw new ConfigError(`Endpoint type is not a string at "${endpoint.id}".`, {
      received: endpoint.type,
      configKey,
    });
  }
  checkDuplicateEndpointId({ id: endpoint.id, configKey });
}

export default validateEndpoint;
