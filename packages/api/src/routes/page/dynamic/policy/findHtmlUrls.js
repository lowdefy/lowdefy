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

// Returns every URL an HTML string can make the client load or navigate to
// through an attribute, as { url, navigation }. With tags allowed, DOMPurify
// keeps <a href> and <img src>, so these are judged as links and sources.
//
// Attributes are matched anywhere in the string, not only inside a tag: a ">"
// in a quoted attribute value would end a tag pattern early and hide the
// attributes after it, and text that only looks like an attribute fails safe.

const ATTRIBUTE =
  /(?:^|[\s/"'])(href|xlink:href|action|formaction|src|poster|background|srcset)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/gi;
const NAVIGATION_ATTRIBUTES = new Set(['href', 'xlink:href', 'action', 'formaction']);
// The named references that spell the characters a URL's scheme and host turn
// on; the browser decodes these before it reads the URL.
const NAMED_REFERENCES = { amp: '&', colon: ':', sol: '/', bsol: '\\', tab: '\t', newline: '\n' };
const REFERENCE = /&(?:#x([0-9a-f]+)|#(\d+)|([a-z]+));?/gi;

function decodeReferences(value) {
  return value.replace(REFERENCE, (match, hex, decimal, name) => {
    if (hex) return String.fromCodePoint(parseInt(hex, 16));
    if (decimal) return String.fromCodePoint(parseInt(decimal, 10));
    return NAMED_REFERENCES[name.toLowerCase()] ?? match;
  });
}

function findHtmlUrls({ value }) {
  const urls = [];
  for (const match of value.matchAll(ATTRIBUTE)) {
    const name = match[1].toLowerCase();
    const attribute = decodeReferences(match[2] ?? match[3] ?? match[4]);
    const navigation = NAVIGATION_ATTRIBUTES.has(name);
    // srcset lists "url descriptor" pairs.
    const entries =
      name === 'srcset'
        ? attribute.split(',').map((entry) => entry.trim().split(/\s+/)[0])
        : [attribute];
    entries.forEach((url) => urls.push({ url, navigation }));
  }
  return urls;
}

export default findHtmlUrls;
