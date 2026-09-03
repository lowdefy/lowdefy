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

import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import collectJsBodies from './collectJsBodies.mjs';
import collectYamlFiles from './collectYamlFiles.mjs';
import countEscapeHatchLines from './countEscapeHatchLines.mjs';
import countIntentComments from './countIntentComments.mjs';
import findDuplicateHelpers from './findDuplicateHelpers.mjs';
import takeCensus from './takeCensus.mjs';

const fixture = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixture');

function linesOf(text) {
  return text.split('\n');
}

test('collectYamlFiles returns every yaml file and skips generated directories', () => {
  assert.deepEqual(collectYamlFiles({ directory: fixture }), [
    'lowdefy.yaml',
    path.join('pages', 'long.yaml'),
    path.join('pages', 'one.yaml'),
    path.join('pages', 'two.yaml'),
  ]);
});

test('countEscapeHatchLines counts a block scalar body as part of its key', () => {
  const counts = countEscapeHatchLines({
    lines: linesOf(`content:
  _js: |
    const a = 1;
    return a;
other: value`),
  });
  assert.equal(counts.js, 3);
});

test('countEscapeHatchLines counts a _js block written as a list item', () => {
  const counts = countEscapeHatchLines({
    lines: linesOf(`values:
  - _js: |
      return 1;
  - plain`),
  });
  assert.equal(counts.js, 2);
});

test('countEscapeHatchLines counts a _js value on the key line as one line', () => {
  const counts = countEscapeHatchLines({ lines: linesOf(`content:\n  _js: state('a')\nnext: 1`) });
  assert.equal(counts.js, 1);
});

test('countEscapeHatchLines does not charge a nested _js twice', () => {
  const counts = countEscapeHatchLines({
    lines: linesOf(`content:
  _js:
    fn: |
      return 1;
    args:
      _js: state('a')`),
  });
  assert.equal(counts.js, 5);
});

test('countEscapeHatchLines counts Html blocks and their template lines apart', () => {
  const counts = countEscapeHatchLines({
    lines: linesOf(`- id: panel
  type: Html
  properties:
    html: |
      <div>
        <span>a</span>
      </div>`),
  });
  assert.equal(counts.htmlBlocks, 1);
  assert.equal(counts.html, 4);
});

test('countEscapeHatchLines counts _nunjucks separately from _js', () => {
  const counts = countEscapeHatchLines({
    lines: linesOf(`content:
  _nunjucks:
    template: Hello {{ name }}
    on:
      _state: true`),
  });
  assert.equal(counts.nunjucks, 4);
  assert.equal(counts.js, 0);
});

test('countIntentComments counts only whole-line comments carrying a rule word', () => {
  const counts = countIntentComments({
    lines: linesOf(`# The build must resolve this first.
# A plain description of the page.
name: page # never inline, this is not a comment line
  # because the tenant wall injects it`),
  });
  assert.equal(counts.commentLines, 3);
  assert.equal(counts.intentLines, 2);
});

test('collectJsBodies skips a _js whose value is on the key line', () => {
  const bodies = collectJsBodies({
    file: 'a.yaml',
    lines: linesOf(`a:\n  _js: state('a')\nb:\n  _js: |\n    return 1;`),
  });
  assert.deepEqual(bodies, [{ file: 'a.yaml', body: 'return 1;' }]);
});

test('collectJsBodies normalizes the indentation the yaml nesting imposed', () => {
  const shallow = collectJsBodies({ file: 'a.yaml', lines: linesOf(`_js: |\n  return 1;`) });
  const deep = collectJsBodies({
    file: 'b.yaml',
    lines: linesOf(`a:\n  b:\n    _js: |\n      return 1;`),
  });
  assert.equal(shallow[0].body, deep[0].body);
});

test('findDuplicateHelpers reports a helper name declared in more than one file', () => {
  const duplicates = findDuplicateHelpers({
    bodies: [
      { file: 'a.yaml', body: "const esc = (s) => s;\nreturn esc('a');" },
      { file: 'b.yaml', body: "const esc = (s) => s;\nreturn esc('b');" },
      { file: 'b.yaml', body: 'const local = (s) => s;\nreturn local(1);' },
    ],
  });
  assert.deepEqual(duplicates.duplicateHelpers, [{ name: 'esc', copies: 2, files: 2 }]);
});

test('findDuplicateHelpers ignores a body repeated inside one file', () => {
  const duplicates = findDuplicateHelpers({
    bodies: [
      { file: 'a.yaml', body: 'return 1;' },
      { file: 'a.yaml', body: 'return 1;' },
    ],
  });
  assert.deepEqual(duplicates.duplicateBodies, []);
  assert.equal(duplicates.jsBodies, 2);
  assert.equal(duplicates.distinctJsBodies, 1);
});

test('takeCensus reports the fixture corpus', () => {
  const result = takeCensus({ directory: fixture });
  assert.equal(result.yamlFiles, 4);
  assert.equal(result.totalLines, 141);
  assert.equal(result.escapeHatch.jsLines, 10);
  assert.equal(result.escapeHatch.htmlBlocks, 1);
  assert.equal(result.escapeHatch.htmlLines, 4);
  assert.equal(result.escapeHatch.nunjucksLines, 4);
  assert.equal(result.escapeHatch.share, 9.93);
  assert.equal(result.escapeHatch.shareWithNunjucks, 12.77);
  assert.equal(result.oversizedFiles.files, 1);
  assert.equal(result.oversizedFiles.share, 25);
  assert.equal(result.comments.intentLines, 1);
  assert.deepEqual(result.duplicates.duplicateHelpers, [{ name: 'esc', copies: 3, files: 2 }]);
  assert.equal(result.duplicates.duplicateBodies.length, 1);
  assert.equal(result.duplicates.duplicateBodies[0].files, 2);
});
