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

/**
 * Resolves a config key (~k) to source and config location.
 *
 * @param {Object} params
 * @param {string} params.configKey - The ~k value from the config object
 * @param {Object} params.keyMap - The keyMap from build output
 * @param {Object} params.refMap - The refMap from build output
 * @param {string} [params.configDirectory] - Absolute path to config directory for clickable links
 * @returns {Object|null} Location object with source and config, or null if not resolvable
 *
 * @example
 * const location = resolveConfigLocation({
 *   configKey: 'abc123',
 *   keyMap: { 'abc123': { key: 'root.pages[0:home].blocks[0:header]', '~r': 'ref1', '~l': 5 } },
 *   refMap: { 'ref1': { path: 'pages/home.yaml' } },
 *   configDirectory: '/Users/dev/myapp'
 * });
 * // Returns: {
 * //   source: '/Users/dev/myapp/pages/home.yaml:5',
 * //   config: 'root.pages[0:home].blocks[0:header]',
 * // }
 */
// Not every ref is a file — a module invocation's ref has no path of its own
// (its content came from the invoking file's vars, and ~l line numbers point
// into that file). Walk the refMap parent chain to the nearest ref that is a
// real file; the root ref with no parent is lowdefy.yaml itself.
function resolveRefPath({ refId, refMap }) {
  let currentId = refId;
  const seen = new Set();
  while (currentId && refMap?.[currentId] && !seen.has(currentId)) {
    seen.add(currentId);
    const refEntry = refMap[currentId];
    if (refEntry.path) {
      return refEntry.path;
    }
    currentId = refEntry.parent;
  }
  return 'lowdefy.yaml';
}

function resolveConfigLocation({ configKey, keyMap, refMap, configDirectory }) {
  if (!configKey || !keyMap || !keyMap[configKey]) {
    return null;
  }

  const keyEntry = keyMap[configKey];
  // A node cloned into a component instance or an archetype expansion is given
  // a key of its own so two instances are two sites; ~k_source names the
  // authored node it was cloned from, which is the file and line a developer
  // has to open to change it.
  const sourceKey = keyEntry['~k_source'];
  const locationEntry = keyMap[sourceKey] ?? keyEntry;
  const refId = locationEntry['~r'];
  const lineNumber = locationEntry['~l'];
  const columnNumber = locationEntry['~c'];
  const filePath = resolveRefPath({ refId, refMap });

  // config: the config path (e.g., "root.pages[0:home].blocks[0:header]")
  const config = locationEntry.key;

  // Use absolute path when configDirectory is available for clickable terminal links
  let resolvedPath = filePath;
  if (configDirectory) {
    resolvedPath = path.resolve(configDirectory, filePath);
  }
  let source = resolvedPath;
  if (lineNumber) {
    source += `:${lineNumber}`;
    // A column is only meaningful with a line; it points at a ${ … } expression
    // scalar compiled to operators.
    if (columnNumber) source += `:${columnNumber}`;
  }

  return {
    source,
    config,
  };
}

export default resolveConfigLocation;
