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

import errorToDisplayString from '../errorToDisplayString.js';
import BaseLowdefyError from '../LowdefyError.js';

/**
 * Client-side LowdefyError with server logging via API.
 *
 * Extends the base LowdefyError to add a log() method that sends
 * the error to /api/client-error for terminal logging, then logs
 * to the browser console.
 *
 * @example
 * const error = new LowdefyError('Unexpected condition');
 * await error.log(lowdefy);
 */
class LowdefyError extends BaseLowdefyError {
  /**
   * Sends the error to the server for terminal logging and logs to console.
   * @param {Object} [lowdefy] - Lowdefy context with basePath
   * @param {Object} [options]
   * @param {number} [options.timeout=1000] - Fetch timeout in ms
   * @returns {Promise<void>}
   */
  async log(lowdefy, { timeout = 1000 } = {}) {
    const basePath = lowdefy?.basePath ?? '';
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const { name, message, stack, configKey } = this;
      await fetch(`${basePath}/api/client-error`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, message, stack, configKey }),
        signal: controller.signal,
        credentials: 'same-origin',
      });
      clearTimeout(timeoutId);
    } catch {
      clearTimeout(timeoutId);
      // Server logging failed - continue with local console
    }
    console.error(errorToDisplayString(this));
  }
}

export default LowdefyError;
