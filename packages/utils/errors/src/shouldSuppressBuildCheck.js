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

import VALID_CHECK_SLUGS from './checkSlugs.js';

/**
 * Checks if a build check should be suppressed based on ~ignoreBuildChecks.
 * Walks up the parent chain looking for suppressions that cover this check.
 * This walk happens ONLY when an error/warning is about to be logged.
 *
 * @param {Object} error - Error/warning object with configKey and optional checkSlug
 * @param {Object} keyMap - The keyMap from build context
 * @returns {boolean} True if the check should be suppressed
 */
function shouldSuppressBuildCheck(error, keyMap) {
  const { configKey, checkSlug } = error;
  if (!configKey || !keyMap) return false;

  let currentKey = configKey;
  let depth = 0;
  const MAX_DEPTH = 100;

  while (currentKey && depth < MAX_DEPTH) {
    const entry = keyMap[currentKey];
    if (!entry) break;

    const ignoredChecks = entry['~ignoreBuildChecks'];

    if (Array.isArray(ignoredChecks) && checkSlug && ignoredChecks.includes(checkSlug)) {
      return true;
    }

    currentKey = entry['~k_parent'];
    depth++;
  }

  return false;
}

export { VALID_CHECK_SLUGS };

export default shouldSuppressBuildCheck;
