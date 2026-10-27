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

import { MENTION_SCHEME, RECORD_SCHEME } from './toTimelineMarkdown.js';

/**
 * What a link in a comment body points at: a mention chip, a record, or a plain link.
 *
 * @param {string} href
 * @returns {{ kind: 'mention', name: string, muted: boolean } | { kind: 'record', key: string } | { kind: 'link', href: string }}
 */
function parseTimelineHref(href) {
  const text = String(href ?? '');
  if (text.startsWith(MENTION_SCHEME)) {
    const rest = text.slice(MENTION_SCHEME.length);
    const cut = rest.indexOf(':');
    return {
      kind: 'mention',
      muted: rest.slice(0, cut) === 'muted',
      name: decodeURIComponent(rest.slice(cut + 1)),
    };
  }
  if (text.startsWith(RECORD_SCHEME)) {
    return { kind: 'record', key: decodeURIComponent(text.slice(RECORD_SCHEME.length)) };
  }
  return { kind: 'link', href: text };
}

export default parseTimelineHref;
