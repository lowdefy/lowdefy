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

import htmlToText from './htmlToText.js';

test('htmlToText turns line breaks and paragraph ends into new lines', () => {
  expect(htmlToText('a<br/>b<BR>c')).toBe('a\nb\nc');
  expect(htmlToText('<p>one</p> <p class="x">two</p>')).toBe('one\ntwo');
});

test('htmlToText drops other tags and decodes common entities', () => {
  expect(htmlToText('<b>Tom</b> &amp; <i>Jerry</i>&nbsp;&lt;3')).toBe('Tom & Jerry <3');
});

test('htmlToText returns a value that is not a string as it is', () => {
  expect(htmlToText(undefined)).toBeUndefined();
});

test('htmlToText keeps a long run of unclosed < as text without backtracking', () => {
  const text = '<'.repeat(100000);
  const start = performance.now();
  expect(htmlToText(text)).toBe(text);
  expect(performance.now() - start).toBeLessThan(1000);
});
