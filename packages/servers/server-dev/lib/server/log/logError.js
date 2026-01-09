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

async function resolveErrorConfigLocation(context, error) {
  if (!error.configKey) {
    return null;
  }
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
    return location || null;
  } catch {
    return null;
  }
}

async function logError({ context, error }) {
  try {
    const location = await resolveErrorConfigLocation(context, error);
    const message = error?.message || 'Unknown error';

    // Human-readable console output (consistent with client format)
    if (location?.link) {
      console.error(`[Config Error] ${location.link}`);
    } else {
      console.error('[Config Error]');
    }
    console.error(`[Msg] ${message}`);
    if (location?.source) {
      console.error(`[Src] ${location.source} at ${location.config}`);
    }

    // Structured logging (consistent with client error schema)
    context.logger.error(
      {
        event: 'server_error',
        errorName: error?.name || 'Error',
        errorMessage: message,
        pageId: context.pageId || null,
        timestamp: new Date().toISOString(),
        source: location?.source || null,
        config: location?.config || null,
        link: location?.link || null,
      },
      message
    );
  } catch (e) {
    console.error(error);
    console.error('An error occurred while logging the error.');
    console.error(e);
  }
}

export default logError;
