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

import { type } from '@lowdefy/helpers';

/**
 * Finds the configKey (~k) for an object at a given instance path.
 * Navigates through the components following the path and returns
 * the deepest ~k value found.
 *
 * @param {Object} params
 * @param {Object} params.components - The components object with ~k markers
 * @param {string[]} params.instancePath - Array of path segments (e.g., ['pages', '0', 'blocks', '0'])
 * @returns {string|undefined} The configKey (~k) value or undefined if not found
 */
function findConfigKey({ components, instancePath }) {
  let current = components;
  let configKey = components['~k'];

  for (const part of instancePath) {
    if (type.isNone(current)) break;
    current = type.isArray(current) ? current[parseInt(part, 10)] : current[part];
    if (current?.['~k']) {
      configKey = current['~k'];
    }
  }
  return configKey;
}

export default findConfigKey;
