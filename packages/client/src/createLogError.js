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

import { ConfigError } from '@lowdefy/helpers';

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

    // Service errors just log without resolution
    if (error.isServiceError === true) {
      console.error(`[Service Error] ${error.message}`);
      return;
    }

    // Wrap in ConfigError if not already (handles plain errors with configKey attached)
    const configError =
      error instanceof ConfigError
        ? error
        : ConfigError.from({ error, configKey: error.configKey });

    // Resolve location and log (non-blocking)
    await configError.log(lowdefy);
  };
}

export default createLogError;
