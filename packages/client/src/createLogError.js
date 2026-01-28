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

import { ConfigError, PluginError, ServiceError } from '@lowdefy/errors/client';

function createLogError(lowdefy) {
  // Track logged errors for deduplication
  const loggedErrors = new Set();

  return async function logError(error) {
    // Deduplicate by message + configKey
    const errorKey = `${error.message}:${error.configKey || ''}`;
    if (loggedErrors.has(errorKey)) {
      return;
    }
    loggedErrors.add(errorKey);

    // ServiceError - log without config resolution (message already formatted in constructor)
    if (error instanceof ServiceError) {
      console.error(error.message);
      return;
    }

    // PluginError - resolve location (if available) and log to server
    if (error instanceof PluginError) {
      const configError = ConfigError.from({ error, configKey: error.configKey });
      await configError.resolve(lowdefy);
      console.error(`${configError.source ? configError.source + '\n' : ''}${error.message}`);
      return;
    }

    // ConfigError - resolve location and log
    if (error instanceof ConfigError) {
      await error.log(lowdefy);
      return;
    }

    // Plain errors with configKey - wrap in ConfigError for location resolution
    if (error.configKey) {
      const configError = ConfigError.from({ error, configKey: error.configKey });
      await configError.log(lowdefy);
      return;
    }

    // Other errors - log as-is
    console.error(`[Error] ${error.message}`);
  };
}

export default createLogError;
