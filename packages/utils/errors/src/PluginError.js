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
 * Base error class for plugin failures (operators, actions, blocks, requests).
 *
 * Plugins throw plain Error objects with simple messages.
 * The plugin interface layer catches these and wraps them in a typed subclass
 * (OperatorError, ActionError, BlockError, RequestError) with additional context.
 *
 * @example
 * // In operator parser (plugin interface layer):
 * try {
 *   return operator({ params });
 * } catch (error) {
 *   if (error instanceof ConfigError) throw error;
 *   throw new OperatorError(error.message, {
 *     cause: error,
 *     typeName: '_if',
 *     received: params,
 *     location: 'blocks.0.properties.visible',
 *     configKey: block['~k'],
 *   });
 * }
 */
class PluginError extends Error {
  /**
   * Creates a PluginError instance with formatted message.
   * @param {string} [message] - Error message (falls back to cause.message)
   * @param {Object} [options]
   * @param {Error} [options.cause] - The original error thrown by the plugin
   * @param {string} [options.typeName] - The config type name (e.g., '_if', 'SetState', 'MongoDBFind')
   * @param {*} [options.received] - The input that caused the error
   * @param {string} [options.location] - Where in the config the error occurred
   * @param {string} [options.configKey] - Config key (~k) for location resolution
   */
  constructor(message, { cause, typeName, received, location, configKey } = {}) {
    const rawMessage = message ?? cause?.message;
    let formattedMessage = rawMessage;
    if (location) {
      formattedMessage = rawMessage ? `${rawMessage} at ${location}.` : `at ${location}.`;
    }

    super(formattedMessage, { cause });
    this.name = 'PluginError';
    this.isLowdefyError = true;
    this.typeName = typeName;
    this._message = rawMessage;
    this.received = received !== undefined ? received : cause?.received;
    this.location = location;
    this.configKey = cause?.configKey ?? configKey ?? null;

    // Location outputs (set by server-side resolution)
    this.source = null;
    this.config = null;
  }
}

export default PluginError;
