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

import BaseConfigError from '../ConfigError.js';
import ConfigMessage from './ConfigMessage.js';

/**
 * Build-time configuration error class.
 * Extends base ConfigError with synchronous location resolution using keyMap/refMap.
 *
 * @example
 * // Simple string (for plugins - location added by interface layer)
 * throw new ConfigError('Connection id missing.');
 *
 * @example
 * // Standard usage with message and context
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
class ConfigError extends BaseConfigError {
  /**
   * Creates a ConfigError instance with build-time formatting.
   * @param {string|Object} messageOrParams - Error message string, or params object
   * @param {string} [messageOrParams.message] - The error message (or use params.error for YAML errors)
   * @param {Error} [messageOrParams.error] - Original error (for YAML parse errors - extracts line number)
   * @param {string} [messageOrParams.configKey] - Config key (~k) for keyMap lookup
   * @param {Object} [messageOrParams.operatorLocation] - { ref, line } for direct refMap lookup
   * @param {string} [messageOrParams.filePath] - Direct file path (for raw mode)
   * @param {number|string} [messageOrParams.lineNumber] - Direct line number (for raw mode)
   * @param {Object} [messageOrParams.context] - Build context with keyMap, refMap, directories
   * @param {string} [messageOrParams.configDirectory] - Config directory (for raw mode without context)
   * @param {string} [messageOrParams.checkSlug] - The specific check being performed
   */
  constructor(messageOrParams) {
    // Support both string and object parameter
    const isString = typeof messageOrParams === 'string';

    if (isString) {
      // Simple string form - just call base constructor
      super(messageOrParams);
      this.suppressed = false;
      this.resolved = false;
      return;
    }

    const {
      message,
      error,
      configKey,
      operatorLocation,
      filePath,
      lineNumber,
      context,
      configDirectory,
      checkSlug,
    } = messageOrParams;

    // Handle YAML parse errors - extract line number from error message
    let finalMessage = message;
    let finalLineNumber = lineNumber;

    if (error instanceof Error) {
      finalMessage = `Could not parse YAML. ${error.message}`;
      const lineMatch = error.message.match(/at line (\d+)/);
      finalLineNumber = lineMatch ? lineMatch[1] : null;
    }

    // Call base constructor with minimal info first
    super({ message: finalMessage, configKey, checkSlug });

    // Store operatorLocation for later resolution if needed
    this.operatorLocation = operatorLocation;

    // Format the message with location using ConfigMessage
    const formattedMessage = ConfigMessage.format({
      prefix: '[Config Error]',
      message: finalMessage,
      configKey,
      operatorLocation,
      filePath,
      lineNumber: finalLineNumber,
      context,
      configDirectory,
      checkSlug,
    });

    // Track if this was suppressed (empty formatted message)
    this.suppressed = formattedMessage === '';

    // Override the message with the formatted one (empty if suppressed)
    this.message = this.suppressed ? '' : formattedMessage;

    // Mark as resolved since we did sync resolution
    this.resolved = true;
  }

  /**
   * Format a message with build context (static helper).
   * @param {Object} params - Same as ConfigMessage.format() but without prefix
   * @returns {string} Formatted error message or empty string if suppressed
   */
  static format(params) {
    return ConfigMessage.format({ ...params, prefix: '[Config Error]' });
  }
}

export default ConfigError;
