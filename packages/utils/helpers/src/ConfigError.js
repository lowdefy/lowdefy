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
 * Client-side configuration error class.
 * Handles async location resolution from server.
 *
 * @example
 * const error = new ConfigError({ message: 'Invalid config', configKey: 'key-123' });
 * await error.log(lowdefy); // Resolves location and logs to console
 */
class ConfigError extends Error {
  /**
   * Creates a ConfigError instance.
   * @param {Object} params
   * @param {string} params.message - The error message
   * @param {string} [params.configKey] - Config key (~k) for location resolution
   */
  constructor({ message, configKey }) {
    super(message);
    this.name = 'ConfigError';
    this.configKey = configKey;
    this.source = null;
    this.config = null;
    this.link = null;
    this.resolved = false;
  }

  /**
   * Resolve location from server (non-blocking).
   * @param {Object} lowdefy - Lowdefy context with basePath and pageId
   * @param {Object} [options]
   * @param {number} [options.timeout=1000] - Fetch timeout in ms
   * @returns {Promise<ConfigError>} Returns this for chaining
   */
  async resolve(lowdefy, { timeout = 1000 } = {}) {
    if (!this.configKey || !lowdefy?.basePath) {
      this.resolved = true;
      return this;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(`${lowdefy.basePath}/api/client-error`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: this.message,
          name: this.name,
          configKey: this.configKey,
          isServiceError: false,
          pageId: lowdefy.pageId,
          timestamp: new Date().toISOString(),
        }),
        signal: controller.signal,
        credentials: 'same-origin',
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const result = await response.json();
        this.source = result.source;
        this.config = result.config;
        this.link = result.link;
      }
    } catch (e) {
      clearTimeout(timeoutId);
      // Resolution failed (timeout or network error) - continue without location
    }

    this.resolved = true;
    return this;
  }

  /**
   * Format error for console output.
   * @returns {string} Formatted error message
   */
  format() {
    if (this.source) {
      let vscodeLink = '';
      if (this.link) {
        const match = this.link.match(/^(.+):(\d+)$/);
        if (match) {
          const [, filePath, line] = match;
          vscodeLink = `vscode://file${filePath}?line=${line}`;
        } else {
          vscodeLink = `vscode://file${this.link}`;
        }
      }
      return `[Config Error] ${this.message}\n  ${this.source} at ${this.config}\n  ${vscodeLink}`;
    }
    return `[Config Error] ${this.message}`;
  }

  /**
   * Resolve location and log to console.
   * @param {Object} lowdefy - Lowdefy context
   * @param {Object} [options]
   * @param {number} [options.timeout=1000] - Fetch timeout in ms
   * @returns {Promise<void>}
   */
  async log(lowdefy, options) {
    await this.resolve(lowdefy, options);
    console.error(this.format());
  }

  /**
   * Create ConfigError from an existing error.
   * @param {Object} params
   * @param {Error} params.error - Original error
   * @param {string} [params.configKey] - Config key for location resolution
   * @returns {ConfigError}
   */
  static from({ error, configKey }) {
    const configError = new ConfigError({
      message: error.message,
      configKey: error.configKey ?? configKey,
    });
    configError.stack = error.stack;
    return configError;
  }
}

export default ConfigError;
