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
 * Base configuration warning class.
 *
 * This is the environment-agnostic base class. For environment-specific behavior:
 * - Build-time: Use @lowdefy/errors/build (prodError flag, suppression logic)
 * - Server-side: Use @lowdefy/errors/server (re-exports base)
 * - Client-side: Use @lowdefy/errors/client (re-exports base)
 *
 * @example
 * const warning = new ConfigWarning({ message: 'Deprecated feature used', source: 'config.yaml:10' });
 * console.warn(warning.message);
 */
class ConfigWarning {
  /**
   * @param {Object} params
   * @param {string} params.message - The warning message
   * @param {string} [params.source] - Source file:line
   */
  constructor({ message, source }) {
    // Message without prefix - logger uses class name for display
    this.message = message;
    this.source = source ?? null;
  }
}

export default ConfigWarning;
