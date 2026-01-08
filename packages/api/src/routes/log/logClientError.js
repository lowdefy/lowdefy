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

import { resolveConfigLocation } from '@lowdefy/helpers';

async function logClientError(context, { configKey, message, name, pageId, stack, timestamp }) {
  const { logger } = context;

  let configLocation = null;

  if (configKey) {
    try {
      const [keyMap, refMap] = await Promise.all([
        context.readConfigFile('keyMap.json'),
        context.readConfigFile('refMap.json'),
      ]);

      const location = resolveConfigLocation({ configKey, keyMap, refMap });
      if (location) {
        configLocation = location.formatted;
      }
    } catch (error) {
      // Maps may not exist in all environments
      logger.warn({ event: 'warn_maps_load_failed', error: error.message });
    }
  }

  const logData = {
    event: 'client_error',
    errorName: name,
    errorMessage: message,
    pageId,
    timestamp,
    configLocation,
  };

  if (configLocation) {
    logger.error({ ...logData, stack }, `Client error at ${configLocation}: ${message}`);
  } else {
    logger.error({ ...logData, stack }, `Client error: ${message}`);
  }

  return {
    success: true,
    configLocation,
  };
}

export default logClientError;
