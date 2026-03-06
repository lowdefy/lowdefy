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

import { type } from '@lowdefy/helpers';

/**
 * Generic depth-first traversal of Lowdefy config objects.
 * Visits every object and array in the tree, calling the visitor function for each.
 *
 * @param {Object} options
 * @param {any} options.config - The config object to traverse
 * @param {Function} options.visitor - Called for each object: visitor(obj) => void
 */
function traverseConfig({ config, visitor }) {
  if (!type.isObject(config) && !type.isArray(config)) return;

  if (type.isObject(config)) {
    visitor(config);
    for (const value of Object.values(config)) {
      traverseConfig({ config: value, visitor });
    }
  }

  if (type.isArray(config)) {
    for (const item of config) {
      traverseConfig({ config: item, visitor });
    }
  }
}

export default traverseConfig;
