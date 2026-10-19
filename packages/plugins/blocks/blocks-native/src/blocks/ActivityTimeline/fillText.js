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

import { placeholderText } from './fillTemplate.js';

const PLACEHOLDER = /\{([^{}|]+)(?:\|([a-z]+))?\}/g;

/**
 * A template as plain text: placeholders filled from the entry as fillTemplate fills them, `**`
 * dropped. Placeholders named in `keep` stay as written, for a later step to fill.
 *
 * @param {Object} params
 * @param {string} params.template
 * @param {Object} params.entry
 * @param {string[]} [params.keep]
 * @returns {string}
 */
function fillText({ template, entry, keep = [] }) {
  return String(template)
    .replace(PLACEHOLDER, (placeholder, path, filter) => {
      if (keep.includes(path.trim())) {
        return placeholder;
      }
      return placeholderText({ entry, path, filter });
    })
    .replaceAll('**', '');
}

export default fillText;
