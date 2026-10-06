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
import type from './type.js';

// posthog-js escapes a quote in a value as \", and an existing \" the same way.
function escapeValue(value) {
  return value.replace(/"|\\"/g, '\\"');
}

// Rewrites the attributes of a posthog-js `$elements_chain`, read the way parseElementsChain
// reads them. filterAttribute({ key, value }) is called for every `key="value"` pair (the
// `text=` entries included) and returns the value to keep (the same string keeps the pair byte
// for byte, another string replaces its value), or null to drop the pair. Tags, classes and
// separators are left as they were. A malformed tail that parseElementsChain would stop at is
// dropped, so nothing unread is sent on.
function filterElementsChain({ chain, filterAttribute }) {
  let output = '';
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
    output += chain.slice(index, headerEnd);
    if (chain[headerEnd] === ':') {
      output += ':';
      index = headerEnd + 1;
      while (index < chain.length && chain[index] !== ';') {
        const keyEnd = chain.indexOf('="', index);
        if (keyEnd === -1) {
          return output;
        }
        const key = chain.slice(index, keyEnd);
        const { value, end } = readChainValue(chain, keyEnd + 2);
        const kept = filterAttribute({ key, value });
        if (kept === value) {
          output += chain.slice(index, end);
        } else if (type.isString(kept)) {
          output += `${key}="${escapeValue(kept)}"`;
        }
        index = end;
      }
    } else {
      index = headerEnd;
    }
    if (index < chain.length) {
      output += ';';
    }
    index += 1;
  }
  return output;
}

export default filterElementsChain;
