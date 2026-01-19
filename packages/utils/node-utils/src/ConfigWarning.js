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

import ConfigError from './ConfigError.js';
import ConfigMessage from './ConfigMessage.js';

/**
 * Utility class for configuration warnings.
 *
 * @example
 * const formatted = ConfigWarning.format({ message, configKey, context });
 * if (formatted) logger.warn(formatted);
 *
 * @example
 * // Throws ConfigError in prod mode when prodError is true
 * ConfigWarning.format({ message, configKey, context, prodError: true });
 */
class ConfigWarning {
  /**
   * Format a warning message with [Config Warning] prefix.
   * In prod mode with prodError: true, throws ConfigError instead.
   *
   * @param {Object} params - Same as ConfigMessage.format() plus prodError
   * @param {boolean} [params.prodError] - If true, throw ConfigError in prod mode
   * @returns {string} Formatted warning message or empty string if suppressed
   * @throws {ConfigError} When prodError is true and context.stage is 'prod'
   */
  static format({ prodError, ...params }) {
    // In prod, throw error instead of warning if prodError flag is set
    if (prodError && params.context?.stage === 'prod') {
      throw new ConfigError(params);
    }
    return ConfigMessage.format({ ...params, prefix: '[Config Warning]' });
  }
}

export default ConfigWarning;
