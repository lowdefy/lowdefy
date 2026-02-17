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

import { resolveConfigLocation } from '@lowdefy/errors';

async function logClientError(context, data) {
  const { logger } = context;

  // Resolve config location if error has configKey
  if (data.configKey) {
    try {
      const [keyMap, refMap] = await Promise.all([
        context.readConfigFile('keyMap.json'),
        context.readConfigFile('refMap.json'),
      ]);

      const location = resolveConfigLocation({
        configKey: data.configKey,
        keyMap,
        refMap,
        configDirectory: context.configDirectory,
      });

      if (location) {
        data.source = location.source;
        data.config = location.config;
        data.link = location.link;
      }
    } catch (err) {
      logger.warn({ event: 'warn_maps_load_failed', error: err.message });
    }
  }

  // Log — data is a plain object with name/message/configKey/etc.
  logger.error(data);

  return {
    success: true,
    source: data.source ?? null,
    config: data.config ?? null,
    link: data.link ?? null,
  };
}

export default logClientError;
