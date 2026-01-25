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

import ConfigMessage from './ConfigMessage.js';

/**
 * Custom error class for configuration errors.
 *
 * @example
 * // Standard usage with message
 * throw new ConfigError({
 *   message: 'Connection id missing.',
 *   configKey: block['~k'],
 *   context,
 * });
 *
 * @example
 * // YAML parse error - pass error object instead of message
 * throw new ConfigError({
 *   error: yamlParseError,
 *   filePath: 'lowdefy.yaml',
 *   configDirectory,
 * });
 */
class ConfigError extends Error {
  /**
   * Creates a ConfigError instance.
   * @param {Object} params
   * @param {string} [params.message] - The error message (or use params.error for YAML errors)
   * @param {Error} [params.error] - Original error (for YAML parse errors - extracts line number)
   * @param {string} [params.configKey] - Config key (~k) for keyMap lookup
   * @param {Object} [params.operatorLocation] - { ref, line } for direct refMap lookup
   * @param {string} [params.filePath] - Direct file path (for raw mode)
   * @param {number|string} [params.lineNumber] - Direct line number (for raw mode)
   * @param {Object} [params.context] - Build context with keyMap, refMap, directories
   * @param {string} [params.configDirectory] - Config directory (for raw mode without context)
   */
  constructor({ message, error, configKey, operatorLocation, filePath, lineNumber, context, configDirectory, checkSlug }) {
    // Handle YAML parse errors - extract line number from error message
    let finalMessage = message;
    let finalLineNumber = lineNumber;

    if (error instanceof Error) {
      finalMessage = `Could not parse YAML. ${error.message}`;
      const lineMatch = error.message.match(/at line (\d+)/);
      finalLineNumber = lineMatch ? lineMatch[1] : null;
    }

    const formattedMessage = ConfigError.format({
      message: finalMessage,
      configKey,
      operatorLocation,
      filePath,
      lineNumber: finalLineNumber,
      context,
      configDirectory,
      checkSlug,
    });

    super(formattedMessage);

    this.name = 'ConfigError';
    this.suppressed = formattedMessage === '';
  }

  /**
   * Format an error message with [Config Error] prefix.
   * @param {Object} params - Same as ConfigMessage.format() but without prefix
   * @returns {string} Formatted error message or empty string if suppressed
   */
  static format(params) {
    return ConfigMessage.format({ ...params, prefix: '[Config Error]' });
  }
}

export default ConfigError;
