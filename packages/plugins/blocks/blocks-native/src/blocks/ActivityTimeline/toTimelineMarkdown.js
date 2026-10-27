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

// react-native-marked passes an href through as is only when its scheme is letters alone.
export const MENTION_SCHEME = 'lowdefymention:';
export const RECORD_SCHEME = 'lowdefyrecord:';

// Code spans and fenced blocks keep their text as written.
const CODE = /(```[\s\S]*?```|`[^`\n]*`)/;
const RECORD_LINK = /\[\[([^[\]\n]+)\]\]/g;

// encodeURIComponent leaves parentheses, which would end a markdown link's href.
function encode(text) {
  return encodeURIComponent(text).replace(/\(/g, '%28').replace(/\)/g, '%29');
}

/**
 * A comment body as the Markdown renderer takes it: each mention token becomes a link with the
 * mention scheme (`lowdefymention:<seen|muted>:<name>`), drawn as an @Name chip, and each other
 * `[[KEY]]` a link with the record scheme (`lowdefyrecord:<KEY>`). A mention is muted when the
 * person named does not see the record. Names come from the comment's mentions, then `people`.
 *
 * @param {Object} params
 * @param {string} params.body
 * @param {Array<{ user_id: string, name: string, sees?: boolean }>} [params.mentions]
 * @param {Map<string, { label: string, sees?: boolean }>} [params.people]
 * @param {RegExp} params.pattern A global mention pattern (createMentionPattern).
 * @returns {string}
 */
function toTimelineMarkdown({ body, mentions, people, pattern }) {
  const named = new Map((mentions ?? []).map((mention) => [mention.user_id, mention]));
  const linkMention = (token, id) => {
    const mention = named.get(id);
    const person = people?.get(id);
    const name = mention?.name ?? person?.label ?? 'Unknown';
    const sees = (mention?.sees ?? person?.sees) !== false;
    return `[@](${MENTION_SCHEME}${sees ? 'seen' : 'muted'}:${encode(name)})`;
  };
  return (type.isString(body) ? body : '')
    .split(CODE)
    .map((part, index) => {
      if (index % 2 === 1) {
        return part;
      }
      return part
        .replace(pattern, linkMention)
        .replace(RECORD_LINK, (token, key) => `[${key}](${RECORD_SCHEME}${encode(key)})`);
    })
    .join('');
}

export default toTimelineMarkdown;
