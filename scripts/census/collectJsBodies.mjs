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

// A body is compared for equality across files, so everything that can differ
// without the code differing is removed: the common indentation the YAML nesting
// imposed, trailing whitespace, and blank lines at either end.
function normalizeBody({ lines }) {
  const body = lines.map((line) => line.replace(/\s+$/, ''));
  const indents = body
    .filter((line) => line !== '')
    .map((line) => line.length - line.trimStart().length);
  if (indents.length === 0) {
    return '';
  }
  const common = Math.min(...indents);
  return body
    .map((line) => line.slice(common))
    .join('\n')
    .replace(/^\n+/, '')
    .replace(/\n+$/, '');
}

// The JavaScript of every `_js` block in one file, as normalized text. A block
// whose value sits on the key line (`_js: state('x')`, or a bare module
// reference) has no body lines and is skipped: there is no helper to duplicate.
function collectJsBodies({ file, lines }) {
  return findBlocks({ lines, keys: ['_js'] })
    .map((block) => ({
      file,
      body: normalizeBody({ lines: lines.slice(block.startIndex + 1, block.endIndex) }),
    }))
    .filter(({ body }) => body !== '');
}

export default collectJsBodies;
