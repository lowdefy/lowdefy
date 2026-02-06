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

import { ConfigError, deserializeError } from '@lowdefy/errors/client';
import { createBrowserLogger } from '@lowdefy/logger/browser';

function createLogError(lowdefy) {
  const logger = createBrowserLogger();

  return async function logError(error) {
    // If error already has source, it came from the server and was already logged there
    // Just log locally on the client
    if (error.source) {
      logger.error(error);
      return;
    }

    // Serialize and send to server for logging with location resolution
    if (error.serialize) {
      try {
        const response = await fetch(`${lowdefy.basePath}/api/client-error`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(error.serialize()),
          credentials: 'same-origin',
        });
        if (response.ok) {
          const result = await response.json();
          if (result.error) {
            logger.error(deserializeError(result.error));
            return;
          }
        }
      } catch (err) {
        // Log server error if we got one, otherwise log original
        if (err['~err']) {
          logger.error(err);
        }
      }
      logger.error(error);
      return;
    }

    // Plain errors with configKey - wrap in ConfigError for serialization
    if (error.configKey) {
      const configError = new ConfigError({ error });
      await logError(configError);
      return;
    }

    // Other errors - just log locally
    logger.error(error);
  };
}

export default createLogError;
