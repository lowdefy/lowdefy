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
 * A tool's name as a person reads it: "search_designs" and "searchDesigns" read "Search designs".
 * An app agent's tool for a module endpoint is named `<module>__<endpoint>`, and an MCP tool may
 * carry a server prefix the same way, so only the last part is read.
 *
 * @param {string} toolName
 * @returns {string}
 */
function humanizeToolName(toolName) {
  if (!type.isString(toolName)) return 'Tool';
  const name = toolName.split('__').pop();
  const words = name
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_\-./:]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
  if (words === '') return 'Tool';
  return `${words.charAt(0).toUpperCase()}${words.slice(1)}`;
}

export default humanizeToolName;
