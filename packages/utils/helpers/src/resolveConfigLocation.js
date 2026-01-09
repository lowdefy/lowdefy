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
 * Resolves a config key (~k) to a human-readable location string.
 *
 * @param {Object} params
 * @param {string} params.configKey - The ~k value from the config object
 * @param {Object} params.keyMap - The keyMap from build output
 * @param {Object} params.refMap - The refMap from build output
 * @returns {Object|null} Location object with path, file, line, and formatted string, or null if not resolvable
 *
 * @example
 * const location = resolveConfigLocation({
 *   configKey: 'abc123',
 *   keyMap: { 'abc123': { key: 'root.pages[0:home].blocks[0:header]', '~r': 'ref1', '~l': 5 } },
 *   refMap: { 'ref1': { path: 'pages/home.yaml' } }
 * });
 * // Returns: { path: 'root.pages[0:home].blocks[0:header]', file: 'pages/home.yaml', line: 5, formatted: 'pages/home.yaml:5 at root.pages[0:home].blocks[0:header]' }
 */
function resolveConfigLocation({ configKey, keyMap, refMap }) {
  if (!configKey || !keyMap || !keyMap[configKey]) {
    return null;
  }

  const keyEntry = keyMap[configKey];
  const refId = keyEntry['~r'];
  const lineNumber = keyEntry['~l'];
  const refEntry = refMap?.[refId];
  const filePath = refEntry?.path || 'lowdefy.yaml';

  // Format: filepath:line for clickable links in terminals/VSCode
  const fileWithLine = lineNumber ? `${filePath}:${lineNumber}` : filePath;

  return {
    path: keyEntry.key,
    file: filePath,
    line: lineNumber || null,
    formatted: `${fileWithLine} at ${keyEntry.key}`,
  };
}

export default resolveConfigLocation;
