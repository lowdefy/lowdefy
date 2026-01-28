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

/**
 * Base error class for configuration errors (invalid YAML, schema violations, validation errors).
 *
 * This is the environment-agnostic base class. For environment-specific behavior:
 * - Build-time: Use @lowdefy/errors/build (sync resolution via keyMap/refMap)
 * - Server-side: Use @lowdefy/errors/server (re-exports base)
 * - Client-side: Use @lowdefy/errors/client (async resolution via API)
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
   * @param {string} [messageOrParams.configKey] - Config key (~k) for location resolution
   * @param {Object} [messageOrParams.location] - Pre-resolved location { source, link, config }
   * @param {string} [messageOrParams.checkSlug] - The build check that triggered this error
   */
  constructor(messageOrParams) {
    // Support both string and object parameter
    const isString = typeof messageOrParams === 'string';
    const message = isString ? messageOrParams : messageOrParams.message;
    const configKey = isString ? null : messageOrParams.configKey;
    const location = isString ? null : messageOrParams.location;
    const checkSlug = isString ? undefined : messageOrParams.checkSlug;

    // Format the message with location if available
    let formattedMessage = `[Config Error] ${message}`;
    if (location?.source) {
      formattedMessage = `${location.source}\n${formattedMessage}`;
    }

    super(formattedMessage);
    this.name = 'ConfigError';
    this.rawMessage = message;
    this.configKey = configKey ?? null;
    this.checkSlug = checkSlug;

    // Location info (can be set via constructor or subclass)
    this.source = location?.source ?? null;
    this.link = location?.link ?? null;
    this.config = location?.config ?? null;
    this.resolved = !!location;
  }

  /**
   * Updates message after location is resolved.
   * Called by subclasses after setting source/link/config.
   * @protected
   */
  _updateMessage() {
    let formattedMessage = `[Config Error] ${this.rawMessage}`;
    if (this.source) {
      formattedMessage = `${this.source}\n${formattedMessage}`;
    }
    this.message = formattedMessage;
  }

  /**
   * Creates a ConfigError from an existing error.
   * @param {Object} params
   * @param {Error} params.error - Original error
   * @param {string} [params.configKey] - Config key for location resolution
   * @param {Object} [params.location] - Pre-resolved location
   * @returns {ConfigError}
   */
  static from({ error, configKey, location }) {
    const configError = new ConfigError({
      message: error.message,
      configKey: error.configKey ?? configKey,
      location,
    });
    configError.stack = error.stack;
    return configError;
  }
}

export default ConfigError;
