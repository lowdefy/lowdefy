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

// Every entry's attributes start with one of these keys, since posthog-js sorts them and always
// writes nth-child: the colon before one ends the tag and class part, which can itself hold a
// colon (a Tailwind class like `md:flex`).
const FIRST_ATTRIBUTE_PREFIXES = ['attr_', 'href="', 'nth-child="'];

function isHeaderEnd(chain, index) {
  if (chain[index] !== ':') {
    return false;
  }
  const next = index + 1;
  if (next === chain.length || chain[next] === ';') {
    return true;
  }
  return FIRST_ATTRIBUTE_PREFIXES.some((prefix) => chain.startsWith(prefix, next));
}

function parseHeader(header) {
  const [tag, ...classes] = header.split('.');
  return { tag: tag.toLowerCase(), classes: classes.filter((name) => name !== '') };
}

// Reads a quoted value from `start` (just past its opening quote). posthog-js escapes a quote
// in a value as \". Returns the value and the index past its closing quote, or the end of the
// chain when the quote is never closed.
function readValue(chain, start) {
  let value = '';
  let index = start;
  while (index < chain.length) {
    const char = chain[index];
    if (char === '\\' && chain[index + 1] === '"') {
      value += '"';
      index += 2;
      continue;
    }
    if (char === '"') {
      return { value, end: index + 1 };
    }
    value += char;
    index += 1;
  }
  return { value, end: index };
}

// Splits a posthog-js `$elements_chain` into entries, target first. Each entry is
// `tag.class1.class2:` followed by sorted `key="value"` pairs, and entries are joined by `;`.
// Total: a malformed chain gives the entries read before the fault.
function parseElementsChain(chain) {
  const entries = [];
  let index = 0;
  while (index < chain.length) {
    let headerEnd = index;
    while (headerEnd < chain.length && chain[headerEnd] !== ';' && !isHeaderEnd(chain, headerEnd)) {
      headerEnd += 1;
    }
    const entry = { ...parseHeader(chain.slice(index, headerEnd)), attributes: {} };
    entries.push(entry);
    if (chain[headerEnd] !== ':') {
      index = headerEnd + 1;
      continue;
    }
    index = headerEnd + 1;
    while (index < chain.length && chain[index] !== ';') {
      const keyEnd = chain.indexOf('="', index);
      if (keyEnd === -1) {
        return entries;
      }
      const { value, end } = readValue(chain, keyEnd + 2);
      entry.attributes[chain.slice(index, keyEnd)] = value;
      index = end;
    }
    index += 1;
  }
  return entries;
}

export default parseElementsChain;
