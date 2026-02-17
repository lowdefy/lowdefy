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
 * Valid check slugs for ~ignoreBuildChecks.
 * Keys are the slug names, values are descriptions for error messages.
 * These suppress BUILD-TIME validation only - runtime errors still occur.
 */
export const VALID_CHECK_SLUGS = {
  'state-refs': 'Undefined _state reference warnings',
  'payload-refs': 'Undefined _payload reference warnings',
  'step-refs': 'Undefined _step reference warnings',
  'link-refs': 'Invalid Link action page reference warnings',
  'request-refs': 'Invalid Request action reference warnings',
  'connection-refs': 'Nonexistent connection ID references',
  types: 'All type validation (blocks, operators, actions, requests, connections)',
  schema: 'JSON schema validation errors',
};

/**
 * Checks if a build check should be suppressed based on ~ignoreBuildChecks.
 * Walks up the parent chain looking for suppressions that cover this check.
 * This walk happens ONLY when an error/warning is about to be logged.
 *
 * @param {Object} params
 * @param {string} params.configKey - Config key (~k) of the error location
 * @param {Object} params.keyMap - The keyMap from build context
 * @param {string} [params.checkSlug] - The specific check being performed (e.g., 'state-refs')
 * @returns {boolean} True if the check should be suppressed
 */
function shouldSuppressBuildCheck({ configKey, keyMap, checkSlug }) {
  if (!configKey || !keyMap) return false;

  let currentKey = configKey;
  let depth = 0;
  const MAX_DEPTH = 100;

  while (currentKey && depth < MAX_DEPTH) {
    const entry = keyMap[currentKey];
    if (!entry) break;

    const ignoredChecks = entry['~ignoreBuildChecks'];

    if (ignoredChecks === true) {
      return true;
    }

    if (Array.isArray(ignoredChecks) && checkSlug && ignoredChecks.includes(checkSlug)) {
      return true;
    }

    currentKey = entry['~k_parent'];
    depth++;
  }

  return false;
}

export default shouldSuppressBuildCheck;
