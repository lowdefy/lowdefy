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
 * Build-time configuration warning class.
 *
 * In development: Creates a formatted warning message
 * In production with prodError: Throws ConfigError instead
 *
 * @example
 * const warning = new ConfigWarning({ message, configKey, context });
 * if (!warning.suppressed) {
 *   logger.warn(warning.message);
 * }
 *
 * @example
 * // Throws ConfigError in prod mode when prodError is true
 * new ConfigWarning({ message, configKey, context, prodError: true });
 */
class ConfigWarning {
  /**
   * @param {Object} params
   * @param {string} params.message - The warning message
   * @param {string} [params.configKey] - Config key (~k) for location resolution
   * @param {Object} [params.operatorLocation] - { ref, line } for direct refMap lookup
   * @param {string} [params.filePath] - Direct file path (for raw mode)
   * @param {number|string} [params.lineNumber] - Direct line number (for raw mode)
   * @param {Object} [params.context] - Build context with keyMap, refMap, directories, stage
   * @param {string} [params.configDirectory] - Config directory (for raw mode without context)
   * @param {string} [params.checkSlug] - The specific check being performed (e.g., 'state-refs')
   * @param {boolean} [params.prodError] - If true, throw ConfigError in prod mode
   * @throws {ConfigError} When prodError is true and context.stage is 'prod'
   */
  constructor({
    message,
    configKey,
    operatorLocation,
    filePath,
    lineNumber,
    context,
    configDirectory,
    checkSlug,
    prodError,
  }) {
    // In prod mode with prodError flag, throw ConfigError instead
    if (prodError && context?.stage === 'prod') {
      throw new ConfigError({ message, configKey, operatorLocation, context, checkSlug });
    }

    this.rawMessage = message;
    this.checkSlug = checkSlug;

    // Check for ~ignoreBuildChecks suppression
    this.suppressed = ConfigMessage.shouldSuppress({
      configKey,
      keyMap: context?.keyMap,
      checkSlug,
    });

    if (this.suppressed) {
      this.message = '';
      return;
    }

    // Format message with location
    this.message = ConfigMessage.format({
      prefix: '[Config Warning]',
      message,
      configKey,
      operatorLocation,
      filePath,
      lineNumber,
      context,
      configDirectory,
      checkSlug,
    });
  }

  /**
   * Static format method for backwards compatibility.
   * @deprecated Use constructor instead: new ConfigWarning({ ... })
   */
  static format(params) {
    const warning = new ConfigWarning(params);
    return warning.message;
  }
}

export default ConfigWarning;
