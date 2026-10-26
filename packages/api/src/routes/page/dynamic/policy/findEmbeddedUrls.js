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

import normalizeUrlText from './normalizeUrlText.js';

// Returns every URL a string can make the client load or navigate to that is
// not given by its key: a whole value with a scheme the browser loads or runs,
// or a protocol-relative one (read as the URL parser reads it), markdown link
// and image targets, and CSS url()/image-set()/src() arguments after
// unescaping. A word such as "INC:42" or "HH:mm" has the shape of a scheme but
// names none the browser acts on, so it is text.
//
// The caller turns off the scans that cannot apply to how the value is drawn: a
// property drawn as text or HTML renders no markdown, and is no link, so neither
// the whole value, a markdown target nor a protocol-relative word in it is a URL;
// CSS url() only loads in text that can carry a style.

// An allowlist of schemes, not a scheme-shaped pattern: any word may hold a colon.
const LOADED_SCHEME = /^(https?|ftp|wss?|file|blob|filesystem|data):\S/i;
// Script schemes run whatever follows them, spaces included.
const SCRIPT_SCHEME = /^(javascript|vbscript):/i;
// The URL parser reads "\" as "/" in http(s) URLs, so "\\host" and "\/host"
// are protocol-relative too.
const PROTOCOL_RELATIVE = /^[\\/]{2}/;
const MARKDOWN_INLINE = /\]\(\s*<?([^)\s>]+)/g;
const MARKDOWN_REFERENCE = /^\s*\[[^\]]+\]:\s*<?([^\s>]+)/gm;
const CSS_FUNCTION = /(url|src|image-set)\(([^)]*)\)/gi;
const QUOTED = /(['"])(.*?)\1/g;

function unescapeCss(value) {
  return value
    .replace(/\\([0-9a-fA-F]{1,6})\s?/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/\\(.)/g, '$1');
}

function findEmbeddedUrls({ value, wholeValue = true, markdown = true, css = true }) {
  const urls = [];
  const text = normalizeUrlText(value);
  const isProtocolRelative = PROTOCOL_RELATIVE.test(text);
  const isUrlText = !/\s/.test(text) && (LOADED_SCHEME.test(text) || isProtocolRelative);
  if (wholeValue && (isUrlText || SCRIPT_SCHEME.test(text))) {
    urls.push(text);
  }
  if (markdown) {
    for (const match of value.matchAll(MARKDOWN_INLINE)) urls.push(match[1]);
    for (const match of value.matchAll(MARKDOWN_REFERENCE)) urls.push(match[1]);
  }
  if (css && value.includes('(')) {
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
