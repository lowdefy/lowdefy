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

import type from './type.js';

// DOMPurify's default allowed URI schemes, so an href set as a block property
// links exactly when the same URL would survive in sanitised HTML.
const safeSchemes = new Set([
  'callto',
  'cid',
  'ftp',
  'ftps',
  'http',
  'https',
  'mailto',
  'matrix',
  'sms',
  'tel',
  'xmpp',
]);
const schemePattern = /^([a-z][a-z0-9+.-]*):/i;
// The browser's URL parser drops leading spaces and controls, and tabs and
// newlines anywhere, before it reads the scheme. A value it would read
// differently from how it is written is refused rather than normalised.
const leadingSpacePattern = /^\s/;
// eslint-disable-next-line no-control-regex
const controlCharacterPattern = /[\u0000-\u001f\u007f]/;

// The href a block renders, or undefined when the value must not become a link:
// URLs with a scheme DOMPurify allows by default pass, as do relative paths,
// query-only and fragment URLs. Any other scheme renders the element without an href.
function getSafeHref(href) {
  if (!type.isString(href) || href === '') return undefined;
  if (leadingSpacePattern.test(href) || controlCharacterPattern.test(href)) return undefined;
  const scheme = schemePattern.exec(href);
  if (scheme === null) return href;
  if (safeSchemes.has(scheme[1].toLowerCase())) return href;
  return undefined;
}

export default getSafeHref;
