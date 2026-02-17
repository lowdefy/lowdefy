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
 * Error class for plugin failures (operators, actions, blocks, connections, requests).
 *
 * Plugins throw plain Error objects with simple messages.
 * The plugin interface layer catches these and wraps them in PluginError
 * with additional context (received values, location, plugin type).
 *
 * @example
 * // In operator parser (plugin interface layer):
 * try {
 *   return operator({ params });
 * } catch (error) {
 *   if (error instanceof ConfigError) throw error;
 *   throw new PluginError({
 *     error,
 *     pluginType: 'operator',
 *     pluginName: '_if',
 *     received: params,
 *     location: 'blocks.0.properties.visible',
 *     configKey: block['~k'],
 *   });
 * }
 * // error.message = "[Plugin Error] _if requires boolean test. Received: {...} at blocks.0.properties.visible."
 */
class PluginError extends Error {
  /**
   * Creates a PluginError instance with formatted message.
   * @param {Object} params
   * @param {Error} params.error - The original error thrown by the plugin
   * @param {string} [params.pluginType] - Type of plugin (operator, action, block, request, connection)
   * @param {string} [params.pluginName] - Name of the plugin (e.g., '_if', 'SetState')
   * @param {*} [params.received] - The input that caused the error
   * @param {string} [params.location] - Where in the config the error occurred
   * @param {string} [params.configKey] - Config key (~k) for location resolution
   */
  constructor({ error, message, pluginType, pluginName, received, location, configKey }) {
    // Store raw message - logger formats received value
    // Accept either error object or direct message string
    const rawMessage = message ?? error?.message;
    let formattedMessage = rawMessage;
    if (location) {
      formattedMessage = rawMessage != null ? `${rawMessage} at ${location}.` : `at ${location}.`;
    }

    super(formattedMessage, { cause: error });
    this.name = 'PluginError';
    this.isLowdefyError = true;
    this.pluginType = pluginType;
    this.pluginName = pluginName;
    this._message = rawMessage;
    this.received = received !== undefined ? received : error?.received;
    this.location = location;
    this.configKey = error?.configKey ?? configKey ?? null;

    // Location outputs (set by server-side resolution)
    this.source = null;
    this.config = null;

    if (error?.stack) {
      this.stack = error.stack;
    }
  }
}

export default PluginError;
