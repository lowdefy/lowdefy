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
 * Error class for internal Lowdefy errors (bugs, unexpected conditions).
 *
 * Use this for unexpected runtime errors, not for config validation errors.
 * ConfigError should be used for user-facing config issues.
 *
 * @example
 * // Create a new error
 * throw new LowdefyInternalError('Unexpected condition');
 *
 * @example
 * // At top-level catch, log the error with stack
 * } catch (err) {
 *   console.error(err.message);
 *   console.error(err.stack);
 * }
 */
class LowdefyInternalError extends Error {
  /**
   * Creates a LowdefyInternalError instance.
   * @param {string} message - The error message
   * @param {Object} [options]
   * @param {Error} [options.cause] - The original error that caused this
   */
  constructor(message, options = {}) {
    // Message without prefix - logger uses error.name for display
    super(message, options);
    this.name = 'LowdefyInternalError';
    this.isLowdefyError = true;
    this.configKey = null;
  }
}

export default LowdefyInternalError;
