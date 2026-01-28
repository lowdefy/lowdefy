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

import { resolveConfigLocation } from '@lowdefy/errors/build';

async function logClientError(
  context,
  { configKey, isServiceError, message, name, pageId, timestamp }
) {
  const { logger } = context;

  let source = null;
  let config = null;
  let link = null;

  // Only resolve config location for config errors (not service errors)
  if (configKey && !isServiceError) {
    try {
      const [keyMap, refMap] = await Promise.all([
        context.readConfigFile('keyMap.json'),
        context.readConfigFile('refMap.json'),
      ]);

      const location = resolveConfigLocation({
        configKey,
        keyMap,
        refMap,
        configDirectory: context.configDirectory,
      });
      if (location) {
        source = location.source;
        config = location.config;
        link = location.link;
      }
    } catch (error) {
      // Maps may not exist in all environments
      logger.warn({ event: 'warn_maps_load_failed', error: error.message });
    }
  }

  const logData = {
    event: isServiceError ? 'client_service_error' : 'client_config_error',
    errorName: name,
    errorMessage: message,
    isServiceError: isServiceError || false,
    pageId,
    timestamp,
    source,
    config,
    link,
  };

  // Human-readable output: source (info/blue) then message (error/red)
  if (source) {
    logger.info(source);
  }
  logger.error(message);

  // Structured logging for log aggregation (debug level - won't display in dev)
  logger.debug(logData);

  return {
    success: true,
    isServiceError: isServiceError || false,
    source,
    config,
    link,
  };
}

export default logClientError;
