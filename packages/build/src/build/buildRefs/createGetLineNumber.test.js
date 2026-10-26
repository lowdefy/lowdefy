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

import { expect, test } from 'vitest';

import createGetLineNumber from './createGetLineNumber.js';

function countLines(content, offset) {
  return content.substring(0, offset).split('\n').length;
}

test('createGetLineNumber returns 1 for every offset on the first line', () => {
  const getLineNumber = createGetLineNumber('id: page\n');
  expect(getLineNumber(0)).toBe(1);
  expect(getLineNumber(4)).toBe(1);
});

test('createGetLineNumber counts a newline at the offset as part of the line it ends', () => {
  const getLineNumber = createGetLineNumber('a: 1\nb: 2\n');
  expect(getLineNumber(4)).toBe(1);
  expect(getLineNumber(5)).toBe(2);
});

test('createGetLineNumber matches counting newlines for every offset of mixed content', () => {
  const content = '\n\nid: page\r\nblocks:\n  - id: a\n\n    type: Box\n    text: |\n      x\n\n      y\n';
  const getLineNumber = createGetLineNumber(content);
  for (let offset = 0; offset <= content.length + 2; offset += 1) {
    expect(getLineNumber(offset)).toBe(countLines(content, offset));
  }
});

test('createGetLineNumber returns 1 for content with no newlines', () => {
  const getLineNumber = createGetLineNumber('id: page');
  expect(getLineNumber(0)).toBe(1);
  expect(getLineNumber(8)).toBe(1);
});
