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
 * All formatting happens in the constructor - properties are ready for the logger.
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
   * All location resolution happens here - no format() method needed.
   *
   * @param {Object} params
   * @param {string} [params.message] - The error message (or use params.error for YAML errors)
   * @param {Error} [params.error] - Original error (for YAML parse errors - extracts line number)
   * @param {string} [params.configKey] - Config key (~k) for keyMap lookup
   * @param {Object} [params.operatorLocation] - { ref, line } for direct refMap lookup
   * @param {string} [params.filePath] - Direct file path (for raw mode)
   * @param {number|string} [params.lineNumber] - Direct line number (for raw mode)
   * @param {Object} [params.context] - Build context with keyMap, refMap, directories
   * @param {string} [params.configDirectory] - Config directory (for raw mode without context)
   * @param {string} [params.checkSlug] - The specific check being performed
   * @param {*} [params.received] - The value that caused the error (for logger to format)
   */
  constructor({
    message,
    error,
    configKey,
    operatorLocation,
    filePath,
    lineNumber,
    context,
    configDirectory,
    checkSlug,
    received,
  }) {
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

    // Store all properties for the logger
    this.configKey = configKey ?? null;
    this.checkSlug = checkSlug;
    this.operatorLocation = operatorLocation;
    this.received = received;

    // Check for ~ignoreBuildChecks suppression
    this.suppressed = ConfigMessage.shouldSuppress({
      configKey,
      keyMap: context?.keyMap,
      checkSlug,
    });

    if (this.suppressed) {
      this.message = '';
      this.source = null;
      this.config = null;
      this.link = null;
      this.resolved = true;
      return;
    }

    // Resolve location based on available info, falling through if a method returns null
    let location = null;
    const configDir = configDirectory ?? context?.directories?.config;

    if (configKey && context?.keyMap) {
      location = ConfigMessage.resolveLocation({ configKey, context });
    }
    if (!location && operatorLocation && context?.refMap) {
      location = ConfigMessage.resolveOperatorLocation({ operatorLocation, context });
    }
    if (!location && filePath) {
      location = ConfigMessage.resolveRawLocation({
        filePath,
        lineNumber: finalLineNumber,
        configDirectory: configDir,
      });
    }

    // Set location properties
    this.source = location?.source ?? null;
    this.config = location?.config ?? null;
    this.link = location?.link ?? null;

    // Set message (no prefix - logger uses error.name for display)
    this.message = finalMessage;

    // Mark as resolved
    this.resolved = true;
  }
}

export default ConfigError;
