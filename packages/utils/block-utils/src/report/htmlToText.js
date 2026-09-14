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

// Tags that end a line of text when the markup is flattened.
const LINE_BREAK_TAGS =
  /<br\s*\/?>|<\/(?:p|div|h[1-6]|li|tr|blockquote|pre|section|article|header|footer)\s*>/gi;
const ANY_TAG = /<[^>]*>/g;

const NAMED_ENTITIES = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

function decodeEntity(match, name) {
  if (name.startsWith('#x') || name.startsWith('#X')) {
    return String.fromCodePoint(Number.parseInt(name.slice(2), 16));
  }
  if (name.startsWith('#')) {
    return String.fromCodePoint(Number.parseInt(name.slice(1), 10));
  }
  return NAMED_ENTITIES[name] ?? match;
}

// Flatten an HTML string to plain text for a report. Block properties such as
// `content` and `title` render through `renderHtml` on the page, so markup in
// them is real markup there; a document text node has no HTML renderer, so the
// tags are dropped and line-ending tags become newlines. A value that is not a
// string is stringified unchanged.
function htmlToText(html) {
  if (!type.isString(html)) return String(html);
  if (!html.includes('<') && !html.includes('&')) return html;
  const withBreaks = html.replace(LINE_BREAK_TAGS, '\n');
  const stripped = withBreaks.replace(ANY_TAG, '');
  const decoded = stripped.replace(/&(#[xX]?[0-9a-fA-F]+|[a-zA-Z]+);/g, decodeEntity);
  return decoded.replace(/\n{3,}/g, '\n\n').trim();
}

export default htmlToText;
