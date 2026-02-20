/*
  Copyright 2020-2026 Lowdefy, Inc

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

/**
 * Base error class for configuration errors (invalid YAML, schema violations, validation errors).
 *
 * Import from @lowdefy/errors for general use.
 *
 * @example
 * // Simple string (for plugins - configKey added by interface layer)
 * throw new ConfigError('Invalid block type');
 *
 * @example
 * // With options
 * throw new ConfigError('Invalid block type', { configKey: block['~k'] });
 *
 * @example
 * // With raw file location (YAML parse errors, pre-addKeys)
 * throw new ConfigError('Error parsing file', {
 *   filePath: 'pages/home.yaml',
 *   lineNumber: 6,
 * });
 *
 * @example
 * // Wrapping an error
 * throw new ConfigError(error.message, { cause: error, filePath });
 */
class ConfigError extends Error {
  /**
   * Creates a ConfigError instance with formatted message.
   * @param {string} [message] - Error message (falls back to cause.message)
   * @param {Object} [options]
   * @param {Error} [options.cause] - Original error to wrap
   * @param {string} [options.configKey] - Config key (~k) for location resolution
   * @param {string} [options.filePath] - Raw file path for pre-addKeys errors
   * @param {string|number} [options.lineNumber] - Line number for pre-addKeys errors
   * @param {string} [options.checkSlug] - The build check that triggered this error
   * @param {*} [options.received] - The input that caused the error
   */
  constructor(message, { cause, configKey, filePath, lineNumber, checkSlug, received } = {}) {
    const resolvedMessage = message ?? cause?.message;

    super(resolvedMessage, { cause });
    this.name = 'ConfigError';
    this.isLowdefyError = true;
    this.configKey = configKey ?? cause?.configKey ?? null;
    this.checkSlug = checkSlug;

    // For logger formatting
    this.received = received !== undefined ? received : cause?.received;

    // Raw file location for pre-addKeys errors (resolved by handleError/handleWarning)
    this.filePath = filePath ?? null;
    this.lineNumber = lineNumber ?? null;

    // Location outputs (set by handlers via resolveErrorLocation, not at construction)
    this.source = null;
    this.config = null;
  }
}

export default ConfigError;
