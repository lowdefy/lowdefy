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

import path from 'path';

/**
 * Resolves a config key (~k) to source and config location.
 *
 * @param {Object} params
 * @param {string} params.configKey - The ~k value from the config object
 * @param {Object} params.keyMap - The keyMap from build output
 * @param {Object} params.refMap - The refMap from build output
 * @param {string} [params.configDirectory] - Absolute path to config directory for clickable links
 * @returns {Object|null} Location object with source, config, and link, or null if not resolvable
 *
 * @example
 * const location = resolveConfigLocation({
 *   configKey: 'abc123',
 *   keyMap: { 'abc123': { key: 'root.pages[0:home].blocks[0:header]', '~r': 'ref1', '~l': 5 } },
 *   refMap: { 'ref1': { path: 'pages/home.yaml' } },
 *   configDirectory: '/Users/dev/myapp'
 * });
 * // Returns: {
 * //   source: 'pages/home.yaml:5',
 * //   config: 'root.pages[0:home].blocks[0:header]',
 * //   link: '/Users/dev/myapp/pages/home.yaml:5'
 * // }
 */
function resolveConfigLocation({ configKey, keyMap, refMap, configDirectory }) {
  if (!configKey || !keyMap || !keyMap[configKey]) {
    return null;
  }

  const keyEntry = keyMap[configKey];
  const refId = keyEntry['~r'];
  const lineNumber = keyEntry['~l'];
  const refEntry = refMap?.[refId];
  const filePath = refEntry?.path || 'lowdefy.yaml';

  // source: filepath:line (e.g., "lowdefy.yaml:16")
  const source = lineNumber ? `${filePath}:${lineNumber}` : filePath;

  // config: the config path (e.g., "root.pages[0:home].blocks[0:header]")
  const config = keyEntry.key;

  // Absolute path for clickable links in VSCode terminal
  let link = null;
  if (configDirectory) {
    const absolutePath = path.resolve(configDirectory, filePath);
    link = lineNumber ? `${absolutePath}:${lineNumber}` : absolutePath;
  }

  return {
    source,
    config,
    link,
  };
}

export default resolveConfigLocation;
