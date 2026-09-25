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

// Returns every URL a string can make the client load or navigate to that is
// not given by its key: a scheme or protocol-relative value, markdown link and
// image targets, and CSS url()/image-set()/src() arguments after unescaping.
const SCHEME = /^[a-zA-Z][a-zA-Z0-9+.-]*:\S/;
const MARKDOWN_INLINE = /\]\(\s*<?([^)\s>]+)/g;
const MARKDOWN_REFERENCE = /^\s*\[[^\]]+\]:\s*<?([^\s>]+)/gm;
const CSS_FUNCTION = /(url|src|image-set)\(([^)]*)\)/gi;
const QUOTED = /(['"])(.*?)\1/g;

function unescapeCss(value) {
  return value
    .replace(/\\([0-9a-fA-F]{1,6})\s?/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/\\(.)/g, '$1');
}

function findEmbeddedUrls(value) {
  const urls = [];
  if (
    !/\s/.test(value) &&
    (SCHEME.test(value) || value.startsWith('//') || value.startsWith('/\\'))
  ) {
    urls.push(value);
  }
  for (const match of value.matchAll(MARKDOWN_INLINE)) urls.push(match[1]);
  for (const match of value.matchAll(MARKDOWN_REFERENCE)) urls.push(match[1]);
  if (value.includes('(')) {
    for (const match of unescapeCss(value).matchAll(CSS_FUNCTION)) {
      const argument = match[2].trim();
      const quoted = [...argument.matchAll(QUOTED)].map((quote) => quote[2]);
      if (quoted.length > 0) {
        urls.push(...quoted);
      } else if (match[1].toLowerCase() !== 'image-set') {
        urls.push(argument);
      }
    }
  }
  return urls;
}

export default findEmbeddedUrls;
