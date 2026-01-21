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

import { ConfigError } from '@lowdefy/node-utils';

/**
 * Collects a config error instead of throwing immediately.
 * Allows the build to continue and collect all errors before stopping.
 *
 * @param {Object} params
 * @param {string} params.message - Error message
 * @param {string} params.configKey - Config key (~k) for location tracking
 * @param {Object} params.context - Build context
 */
function collectConfigError({ message, configKey, context }) {
  const errorMessage = ConfigError.format({ message, configKey, context });

  if (!errorMessage) {
    return; // Suppressed - don't collect or log
  }

  if (!context.errors) {
    // If no error collection array, throw immediately (fallback for tests)
    throw new Error(errorMessage);
  }

  // Collect error - logging happens at checkpoints in index.js
  context.errors.push(errorMessage);
}

export default collectConfigError;
