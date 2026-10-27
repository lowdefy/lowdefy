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
 * Splits a markdown value into the segments the composer draws: plain text, and the mention
 * tokens it holds, each named from `people`. A token for someone not in `people` keeps its id
 * and shows as "Unknown".
 *
 * @param {Object} params
 * @param {string} params.value The markdown value, with mention tokens.
 * @param {RegExp} params.pattern A global mention pattern (createMentionPattern).
 * @param {Map<string, { label: string, sees?: boolean }>} params.people People by id.
 * @returns {Array<{ kind: 'text', text: string } | { kind: 'mention', id: string, name: string, sees: boolean }>}
 */
function parseMentionValue({ value, pattern, people }) {
  const text = type.isString(value) ? value : '';
  const segments = [];
  let last = 0;
  pattern.lastIndex = 0;
  for (const match of text.matchAll(pattern)) {
    if (match.index > last) {
      segments.push({ kind: 'text', text: text.slice(last, match.index) });
    }
    const person = people.get(match[1]);
    segments.push({
      kind: 'mention',
      id: match[1],
      name: person?.label ?? 'Unknown',
      sees: person?.sees !== false,
    });
    last = match.index + match[0].length;
  }
  if (last < text.length) {
    segments.push({ kind: 'text', text: text.slice(last) });
  }
  return segments;
}

export default parseMentionValue;
