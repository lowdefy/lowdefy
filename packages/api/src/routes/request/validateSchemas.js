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

import { validate } from '@lowdefy/ajv';
import { ConfigError } from '@lowdefy/errors';

import formatValidationError from '../log/formatValidationError.js';

function validateSchemas(
  { logger },
  { connection, connectionProperties, requestConfig, requestResolver, requestProperties }
) {
  const configKey = requestConfig['~k'];
  const allErrors = [];

  const connectionResult = validate({
    schema: connection.schema,
    data: connectionProperties,
    returnErrors: true,
  });
  if (!connectionResult.valid) {
    for (const ajvError of connectionResult.errors) {
      allErrors.push(
        new ConfigError(
          formatValidationError({
            ajvError,
            pluginLabel: 'Connection',
            typeName: requestConfig.connectionId,
            fieldLabel: 'property',
          }),
          { configKey }
        )
      );
    }
  }

  const requestResult = validate({
    schema: requestResolver.schema,
    data: requestProperties,
    returnErrors: true,
  });
  if (!requestResult.valid) {
    for (const ajvError of requestResult.errors) {
      allErrors.push(
        new ConfigError(
          formatValidationError({
            ajvError,
            pluginLabel: 'Request',
            typeName: requestConfig.type,
            fieldLabel: 'property',
          }),
          { configKey }
        )
      );
    }
  }

  if (allErrors.length > 0) {
    // Log additional errors here; the first will be logged by the upstream error handler
    for (const err of allErrors.slice(1)) {
      logger.error(err);
    }
    throw allErrors[0];
  }
}

export default validateSchemas;
