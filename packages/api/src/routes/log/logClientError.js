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
import { deserializeError } from '@lowdefy/errors/server';

async function logClientError(context, data) {
  const { logger } = context;

  // Deserialize the error from the client
  const error = deserializeError(data);

  // Resolve config location if error has configKey
  if (error.configKey) {
    try {
      const [keyMap, refMap] = await Promise.all([
        context.readConfigFile('keyMap.json'),
        context.readConfigFile('refMap.json'),
      ]);

      const location = resolveConfigLocation({
        configKey: error.configKey,
        keyMap,
        refMap,
        configDirectory: context.configDirectory,
      });

      if (location) {
        error.source = location.source;
        error.config = location.config;
        error.link = location.link;
      }
    } catch (err) {
      logger.warn({ event: 'warn_maps_load_failed', error: err.message });
    }
  }

  // Log error - logger handles formatting based on error.name and error.source
  logger.error(error);

  return {
    success: true,
    source: error.source ?? null,
    config: error.config ?? null,
    link: error.link ?? null,
  };
}

export default logClientError;
