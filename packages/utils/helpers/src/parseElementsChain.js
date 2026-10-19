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

import isChainHeaderEnd from './isChainHeaderEnd.js';
import readChainValue from './readChainValue.js';

function parseHeader(header) {
  const [tag, ...classes] = header.split('.');
  return { tag: tag.toLowerCase(), classes: classes.filter((name) => name !== '') };
}

// Splits a posthog-js `$elements_chain` into entries, target first. Each entry is
// `tag.class1.class2:` followed by sorted `key="value"` pairs, and entries are joined by `;`.
// Total: a malformed chain gives the entries read before the fault.
function parseElementsChain(chain) {
  const entries = [];
  let index = 0;
  while (index < chain.length) {
    let headerEnd = index;
    while (
      headerEnd < chain.length &&
      chain[headerEnd] !== ';' &&
      !isChainHeaderEnd(chain, headerEnd)
    ) {
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
      const { value, end } = readChainValue(chain, keyEnd + 2);
      entry.attributes[chain.slice(index, keyEnd)] = value;
      index = end;
    }
    index += 1;
  }
  return entries;
}

export default parseElementsChain;
