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
 * Absorbs 3 resolution paths:
 *   1. configKey → resolveConfigLocation (standard keyMap/refMap lookup)
 *   2. operatorLocation → resolve via refMap (operator warnings in buildRefs)
 *   3. filePath + lineNumber → raw path join (YAML parse errors)
 *
 * Mutates data, setting .source, .config, .link. Returns data.
 *
 * @param {Object} data - Error or params object to resolve location on
 * @param {Object} options
 * @param {Object} [options.keyMap] - The keyMap from build context
 * @param {Object} [options.refMap] - The refMap from build context
 * @param {string} [options.configDirectory] - Absolute path to config directory
 * @returns {Object} The mutated data object
 */
function resolveErrorLocation(data, { keyMap, refMap, configDirectory }) {
  if (!data) return data;

  // Path 1: configKey → standard keyMap/refMap lookup
  if (data.configKey) {
    const location = resolveConfigLocation({
      configKey: data.configKey,
      keyMap,
      refMap,
      configDirectory,
    });
    if (location) {
      data.source = location.source;
      data.config = location.config;
      data.link = location.link;
      return data;
    }
  }

  // Path 2: operatorLocation → resolve via refMap (operator warnings in buildRefs)
  if (data.operatorLocation) {
    const refEntry = refMap?.[data.operatorLocation.ref];
    if (refEntry?.path) {
      const filePath = refEntry.path;
      const lineNumber = data.operatorLocation.line;

      let resolvedPath = filePath;
      if (configDirectory) {
        resolvedPath = path.join(configDirectory, filePath);
      }
      const source = lineNumber ? `${resolvedPath}:${lineNumber}` : resolvedPath;
      data.source = source;
      data.link = source;
      return data;
    }
  }

  // Path 3: filePath + lineNumber → raw path join (YAML parse errors)
  if (data.filePath) {
    let resolvedPath = data.filePath;
    if (configDirectory) {
      resolvedPath = path.join(configDirectory, data.filePath);
    }
    const source = data.lineNumber ? `${resolvedPath}:${data.lineNumber}` : resolvedPath;
    data.source = source;
    data.link = source;
    return data;
  }

  return data;
}

export default resolveErrorLocation;
