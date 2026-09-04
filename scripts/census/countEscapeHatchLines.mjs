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

import findBlocks from './findBlocks.mjs';

const htmlBlockType = /^\s*(?:-\s+)*type\s*:\s*Html\s*$/;

function countLines({ lines, keys }) {
  // A line set, not a sum of block lengths: an `_js` nested inside another
  // `_js` (a `fn:` body that itself contains one) would otherwise be charged
  // twice and the share could exceed 100%.
  const counted = new Set();
  for (const block of findBlocks({ lines, keys })) {
    for (let index = block.startIndex; index < block.endIndex; index += 1) {
      counted.add(index);
    }
  }
  return counted.size;
}

// The lines of a config that are JavaScript, a nunjucks template, or HTML
// rather than Lowdefy config. `html:` is the Html block's template property;
// `htmlBlocks` counts the blocks those templates belong to.
function countEscapeHatchLines({ lines }) {
  return {
    js: countLines({ lines, keys: ['_js'] }),
    nunjucks: countLines({ lines, keys: ['_nunjucks'] }),
    html: countLines({ lines, keys: ['html'] }),
    htmlBlocks: lines.filter((line) => htmlBlockType.test(line)).length,
  };
}

export default countEscapeHatchLines;
