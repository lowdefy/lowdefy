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
 * Error class for internal Lowdefy errors (bugs, unexpected conditions).
 * Message is formatted with [Lowdefy Error] prefix in the constructor.
 *
 * Use this for unexpected runtime errors, not for config validation errors.
 * ConfigError should be used for user-facing config issues.
 *
 * @example
 * // Create a new error - message is auto-formatted
 * throw new LowdefyError('Unexpected condition');
 * // error.message = "[Lowdefy Error] Unexpected condition"
 *
 * @example
 * // At top-level catch, log the error with stack
 * } catch (err) {
 *   console.error(err.message);
 *   console.error(err.stack);
 * }
 */
class LowdefyError extends Error {
  /**
   * Creates a LowdefyError instance with formatted message.
   * @param {string} message - The raw error message
   * @param {Object} [options]
   * @param {Error} [options.cause] - The original error that caused this
   */
  constructor(message, options = {}) {
    super(`[Lowdefy Error] ${message}`, options);
    this.name = 'LowdefyError';
    this.rawMessage = message;
    this.configKey = null;
  }

  /**
   * Creates a LowdefyError from an existing error.
   * Preserves the original stack trace.
   * @param {Error} error - The original error
   * @returns {LowdefyError}
   */
  static from(error) {
    const lowdefyError = new LowdefyError(error.message, { cause: error });
    lowdefyError.stack = error.stack;
    return lowdefyError;
  }
}

export default LowdefyError;
