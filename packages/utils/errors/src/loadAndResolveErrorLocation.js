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

import path from 'path';

import resolveConfigLocation from './resolveConfigLocation.js';

/**
 * Resolves error config location at runtime by reading keyMap and refMap files.
 * Used by server-side error logging to trace errors back to source files.
 *
 * Two resolution paths:
 *   1. configKey → keyMap/refMap lookup (standard post-addKeys errors)
 *   2. filePath + lineNumber → path.resolve (YAML parse errors, pre-addKeys)
 *
 * @param {Object} params
 * @param {Object} params.error - Error object with optional configKey/filePath properties
 * @param {Function} params.readConfigFile - Async function to read config files
 * @param {string} params.configDirectory - Absolute path to config directory
 * @returns {Promise<Object|null>} Location object with source and config, or null
 */
async function loadAndResolveErrorLocation({ error, readConfigFile, configDirectory }) {
  if (!error) return null;

  // Path 1: configKey → keyMap/refMap lookup
  if (error.configKey) {
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
      if (location) return location;
    } catch {
      // Fall through to path 2
    }
  }

  // Path 2: filePath + lineNumber (YAML parse errors, pre-addKeys)
  if (error.filePath) {
    let resolvedPath = error.filePath;
    if (configDirectory) {
      resolvedPath = path.resolve(configDirectory, error.filePath);
    }
    const source = error.lineNumber ? `${resolvedPath}:${error.lineNumber}` : resolvedPath;
    return { source };
  }

  return null;
}

export default loadAndResolveErrorLocation;
