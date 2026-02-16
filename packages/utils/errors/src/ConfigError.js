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
 * throw new ConfigError({
 *   message: 'Invalid block type',
 *   configKey: block['~k'],
 *   location: { source: 'pages/home.yaml:42', link: '/path/to/pages/home.yaml:42' }
 * });
 */
class ConfigError extends Error {
  /**
   * Creates a ConfigError instance with formatted message.
   * @param {string|Object} messageOrParams - Error message string, or params object
   * @param {string} [messageOrParams.message] - The error message (if object)
   * @param {Error} [messageOrParams.error] - Original error to wrap (extracts message/configKey/stack)
   * @param {string} [messageOrParams.configKey] - Config key (~k) for location resolution
   * @param {Object} [messageOrParams.location] - Pre-resolved location { source, link, config }
   * @param {string} [messageOrParams.checkSlug] - The build check that triggered this error
   */
  constructor(messageOrParams) {
    // Support both string and object parameter
    const isString = typeof messageOrParams === 'string';
    const error = isString ? null : messageOrParams.error;
    const message = isString ? messageOrParams : messageOrParams.message ?? error?.message;
    const configKey = isString ? null : messageOrParams.configKey ?? error?.configKey;
    const location = isString ? null : messageOrParams.location;
    const checkSlug = isString ? undefined : messageOrParams.checkSlug;
    const received = isString
      ? undefined
      : messageOrParams.received !== undefined
        ? messageOrParams.received
        : error?.received;
    const operatorLocation = isString ? null : messageOrParams.operatorLocation;

    // Message without prefix - logger uses error.name for display
    super(message);
    this.name = 'ConfigError';
    this.configKey = configKey ?? null;
    this.checkSlug = checkSlug;

    // For logger formatting
    this.received = received;
    this.operatorLocation = operatorLocation;

    // Location info (can be set via constructor or subclass)
    this.source = location?.source ?? null;
    this.link = location?.link ?? null;
    this.config = location?.config ?? null;
    this.resolved = !!location;

    // Preserve original error's stack if wrapping
    if (error?.stack) {
      this.stack = error.stack;
    }
  }
}

export default ConfigError;
