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
 * Unified sync location resolver for build-time errors and warnings.
 * Two resolution paths:
 *   1. configKey → resolveConfigLocation (standard keyMap/refMap lookup, post-addKeys)
 *   2. filePath + lineNumber → raw path join (pre-addKeys: YAML parse errors, operator eval)
 *
 * Returns { source, config } or null. Does not mutate data.
 *
 * @param {Object} data - Error or params object to resolve location from
 * @param {Object} options
 * @param {Object} [options.keyMap] - The keyMap from build context
 * @param {Object} [options.refMap] - The refMap from build context
 * @param {string} [options.configDirectory] - Absolute path to config directory
 * @returns {Object|null} Location object with source and config, or null
 */
function resolveErrorLocation(data, { keyMap, refMap, configDirectory }) {
  if (!data) return null;

  // Path 1: configKey → standard keyMap/refMap lookup
  if (data.configKey) {
    const location = resolveConfigLocation({
      configKey: data.configKey,
      keyMap,
      refMap,
      configDirectory,
    });
    if (location) {
      return location;
    }
  }

  // Path 2: filePath + lineNumber → raw path join (YAML parse errors, operator eval)
  if (data.filePath) {
    let resolvedPath = data.filePath;
    if (configDirectory) {
      resolvedPath = path.join(configDirectory, data.filePath);
    }
    const source = data.lineNumber ? `${resolvedPath}:${data.lineNumber}` : resolvedPath;
    return { source };
  }

  return null;
}

export default resolveErrorLocation;
