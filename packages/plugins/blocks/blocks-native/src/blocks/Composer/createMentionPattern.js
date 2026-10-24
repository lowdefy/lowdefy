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

export const DEFAULT_MENTION_FORMAT = '[[user:{id}]]';

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * The pattern that finds mention tokens written in `format`, a template holding `{id}` once,
 * such as `[[user:{id}]]`. The id is its first group. A format with nothing after `{id}` takes
 * the run of word characters, dots and dashes as the id.
 *
 * @param {string} [format] The mention format; `[[user:{id}]]` when not set.
 * @returns {RegExp} A global pattern.
 */
function createMentionPattern(format) {
  const template = type.isString(format) ? format : DEFAULT_MENTION_FORMAT;
  const at = template.indexOf('{id}');
  if (at < 0) {
    throw new Error(`Mention format must hold "{id}". Received ${JSON.stringify(format)}.`);
  }
  const prefix = escapeRegExp(template.slice(0, at));
  const suffix = template.slice(at + 4);
  if (suffix === '') {
    return new RegExp(`${prefix}([\\w.-]+)`, 'g');
  }
  return new RegExp(`${prefix}([^\\s\\[\\]]+?)${escapeRegExp(suffix)}`, 'g');
}

export default createMentionPattern;
