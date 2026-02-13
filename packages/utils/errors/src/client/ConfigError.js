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

import BaseConfigError from '../ConfigError.js';

/**
 * Client-side ConfigError with async location resolution via API.
 *
 * Extends the base ConfigError to add async resolution that calls
 * the /api/client-error endpoint to resolve configKey to file:line.
 *
 * @example
 * const error = new ConfigError({ message: 'Invalid operator', configKey });
 * await error.resolve(lowdefy);
 * console.error(error.source); // "pages/home.yaml:42"
 * console.error(error.message); // "Invalid operator"
 */
class ConfigError extends BaseConfigError {
  /**
   * Resolves location from server (async).
   * Updates this.message with the resolved location.
   * @param {Object} lowdefy - Lowdefy context with basePath and pageId
   * @param {Object} [options]
   * @param {number} [options.timeout=1000] - Fetch timeout in ms
   * @returns {Promise<ConfigError>} Returns this for chaining
   */
  async resolve(lowdefy, { timeout = 1000 } = {}) {
    // basePath can be empty string "" which is valid (no custom base path)
    if (this.resolved || lowdefy?.basePath === undefined) {
      this.resolved = true;
      return this;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const { name, message, stack, configKey, received, operatorLocation } = this;
      const response = await fetch(`${lowdefy.basePath}/api/client-error`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, message, stack, configKey, received, operatorLocation }),
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
    } catch {
      clearTimeout(timeoutId);
      // Resolution failed (timeout or network error) - continue without location
    }

    this.resolved = true;
    return this;
  }

  /**
   * Resolves location (if not already resolved) and logs to console.
   * @param {Object} [lowdefy] - Lowdefy context for resolution
   * @param {Object} [options] - Options for resolution
   * @returns {Promise<void>}
   */
  async log(lowdefy, options) {
    if (!this.resolved && lowdefy) {
      await this.resolve(lowdefy, options);
    }
    console.error(this.message);
  }
}

export default ConfigError;
