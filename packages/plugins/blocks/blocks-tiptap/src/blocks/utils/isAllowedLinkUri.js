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

// Control characters and spaces are stripped before the check, as in v2.
// eslint-disable-next-line no-control-regex
const UNICODE_WHITESPACE = /[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205F\u3000]/g;

const DEFAULT_PROTOCOLS = [
  'http',
  'https',
  'ftp',
  'ftps',
  'mailto',
  'tel',
  'callto',
  'sms',
  'cid',
  'xmpp',
];

// TipTap v2's check for which link hrefs are allowed (the Link `isAllowedUri` option). v3 fixed
// an escaping slip in v2's pattern: the last character class holds the range "." to ":" (".",
// "/", digits, ":"), so v2 rejects relative or protocol-less hrefs such as "docs/page" or
// "example.org/path" and drops the link. Keeping v2's check keeps the saved html the same.
function isAllowedLinkUri(uri, { protocols }) {
  if (!uri) return true;
  const allowedProtocols = [...DEFAULT_PROTOCOLS];
  (protocols ?? []).forEach((protocol) => {
    const scheme = type.isString(protocol) ? protocol : protocol.scheme;
    if (scheme) allowedProtocols.push(scheme);
  });
  const pattern = new RegExp(
    `^(?:(?:${allowedProtocols.join('|')}):|[^a-z]|[a-z0-9+.-]+(?:[^a-z+.-:]|$))`,
    'i'
  );
  return pattern.test(uri.replace(UNICODE_WHITESPACE, ''));
}

export default isAllowedLinkUri;
