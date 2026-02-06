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

import { validate } from '@lowdefy/ajv';

import { ConfigError } from '@lowdefy/errors/server';

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
    allErrors.push(...connectionResult.errors);
  }

  const requestResult = validate({
    schema: requestResolver.schema,
    data: requestProperties,
    returnErrors: true,
  });
  if (!requestResult.valid) {
    allErrors.push(...requestResult.errors);
  }

  if (allErrors.length === 0) {
    return;
  }

  const errors = allErrors.map((error) => new ConfigError({ message: error.message, configKey }));

  for (const err of errors) {
    logger.debug(
      { params: { id: requestConfig.requestId, type: requestConfig.type, configKey }, err },
      err.message
    );
  }

  const primaryError = errors[0];
  if (errors.length > 1) {
    primaryError.additionalErrors = errors.slice(1);
  }
  throw primaryError;
}

export default validateSchemas;
