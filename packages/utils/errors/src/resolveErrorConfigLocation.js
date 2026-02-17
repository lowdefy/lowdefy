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

import resolveConfigLocation from './resolveConfigLocation.js';

/**
 * Resolves error config location at runtime by reading keyMap and refMap files.
 * Used by server-side error logging to trace errors back to source files.
 *
 * @param {Object} params
 * @param {Object} params.error - Error object with optional configKey property
 * @param {Function} params.readConfigFile - Async function to read config files
 * @param {string} params.configDirectory - Absolute path to config directory
 * @returns {Promise<Object|null>} Location object with source, config, and link, or null
 */
async function resolveErrorConfigLocation({ error, readConfigFile, configDirectory }) {
  if (!error?.configKey) {
    return null;
  }
  try {
    const [keyMap, refMap] = await Promise.all([
      readConfigFile('keyMap.json'),
      readConfigFile('refMap.json'),
    ]);
    const location = resolveConfigLocation({
      configKey: error.configKey,
      keyMap,
      refMap,
      configDirectory,
    });
    return location || null;
  } catch {
    return null;
  }
}

export default resolveErrorConfigLocation;
