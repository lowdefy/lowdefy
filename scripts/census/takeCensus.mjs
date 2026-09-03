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

import path from 'node:path';

import collectJsBodies from './collectJsBodies.mjs';
import collectYamlFiles from './collectYamlFiles.mjs';
import countEscapeHatchLines from './countEscapeHatchLines.mjs';
import countIntentComments from './countIntentComments.mjs';
import findDuplicateHelpers from './findDuplicateHelpers.mjs';
import readLines from './readLines.mjs';

// A file longer than a screen is a file an agent reads in pieces and a reviewer
// skims. The threshold is the design's; changing it changes every number that
// has ever been compared against it.
const OVERSIZED_FILE_LINES = 80;

function percent({ part, total }) {
  if (total === 0) {
    return 0;
  }
  return Number(((part / total) * 100).toFixed(2));
}

function takeCensus({ directory }) {
  const files = collectYamlFiles({ directory });
  const totals = {
    lines: 0,
    oversized: 0,
    js: 0,
    nunjucks: 0,
    html: 0,
    htmlBlocks: 0,
    comments: 0,
    intent: 0,
  };
  const bodies = [];

  for (const file of files) {
    const lines = readLines({ filePath: path.join(directory, file) });
    totals.lines += lines.length;
    if (lines.length > OVERSIZED_FILE_LINES) {
      totals.oversized += 1;
    }
    const hatch = countEscapeHatchLines({ lines });
    totals.js += hatch.js;
    totals.nunjucks += hatch.nunjucks;
    totals.html += hatch.html;
    totals.htmlBlocks += hatch.htmlBlocks;
    const comments = countIntentComments({ lines });
    totals.comments += comments.commentLines;
    totals.intent += comments.intentLines;
    bodies.push(...collectJsBodies({ file, lines }));
  }

  // Appendix A's 11.8% is `_js` plus `Html` template lines. `_nunjucks` is
  // reported beside it rather than inside it so the headline number stays
  // comparable with the census that produced the target.
  const escapeHatchLines = totals.js + totals.html;

  return {
    directory,
    yamlFiles: files.length,
    totalLines: totals.lines,
    escapeHatch: {
      jsLines: totals.js,
      nunjucksLines: totals.nunjucks,
      htmlBlocks: totals.htmlBlocks,
      htmlLines: totals.html,
      lines: escapeHatchLines,
      share: percent({ part: escapeHatchLines, total: totals.lines }),
      shareWithNunjucks: percent({
        part: escapeHatchLines + totals.nunjucks,
        total: totals.lines,
      }),
    },
    oversizedFiles: {
      threshold: OVERSIZED_FILE_LINES,
      files: totals.oversized,
      share: percent({ part: totals.oversized, total: files.length }),
    },
    comments: {
      lines: totals.comments,
      share: percent({ part: totals.comments, total: totals.lines }),
      intentLines: totals.intent,
    },
    duplicates: findDuplicateHelpers({ bodies }),
  };
}

export { OVERSIZED_FILE_LINES };
export default takeCensus;
