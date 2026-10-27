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

import { toAtoms } from './segmentText.js';

// A mention's characters, masked so neither picker opens on the "@Name" a mention shows.
const MASK = '￼';

// An @ at a word start (the line start, after whitespace or an opening bracket), and what was
// typed after it, up to the cursor.
const MENTION_OPEN = new RegExp(`(^|[\\s([{])@([^@\\n${MASK}]{0,40})$`);
const LINK_OPEN = new RegExp(`\\[\\[([^\\[\\]\\n${MASK}]{0,60})$`);

/**
 * The picker the text before the cursor opens: a mention (an @ at a word start) or a record
 * link (an open `[[`), with the offset of the @ or the `[[` in the shown text and the query typed
 * after it. A mention query never starts with whitespace.
 *
 * @param {Object} params
 * @param {Array} params.segments The input's segments.
 * @param {number} params.cursor The collapsed cursor's offset in the shown text.
 * @returns {null | { kind: 'mention' | 'link', at: number, query: string }}
 */
function findTrigger({ segments, cursor }) {
  const masked = toAtoms(segments)
    .filter((atom) => atom.start < cursor)
    .map((atom) => (atom.segment ? MASK.repeat(atom.end - atom.start) : atom.char))
    .join('');
  const link = LINK_OPEN.exec(masked);
  if (link) {
    return { kind: 'link', at: link.index, query: link[1] };
  }
  const mention = MENTION_OPEN.exec(masked);
  if (!mention || /^\s/.test(mention[2])) {
    return null;
  }
  return { kind: 'mention', at: mention.index + mention[1].length, query: mention[2] };
}

export default findTrigger;
