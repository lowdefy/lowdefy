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

import markdownToHtml from './markdownToHtml.js';

test('markdownToHtml draws markdown as react-markdown does with remark-gfm', () => {
  expect(markdownToHtml({ markdown: '# Notes\n\n**Bold** and `code`\n\n- [x] Done' })).toEqual({
    html: '<h1>Notes</h1><p><strong>Bold</strong> and <code>code</code></p><ul><li><input type="checkbox" disabled> <p>Done</p></li></ul>',
    open: null,
  });
});

test('markdownToHtml shows raw html as text, leaves it out with skipHtml, and draws it raw', () => {
  expect(markdownToHtml({ markdown: '<b>x</b>' }).html).toBe('<p>&lt;b&gt;x&lt;/b&gt;</p>');
  expect(markdownToHtml({ markdown: '<b>x</b>', skipHtml: true }).html).toBe('<p>x</p>');
  expect(markdownToHtml({ markdown: '<b>x</b>', raw: true }).html).toBe('<p><b>x</b></p>');
});

test('markdownToHtml leaves a footnote open', () => {
  expect(markdownToHtml({ markdown: 'Text[^1]\n\n[^1]: Note' }).open).toContain('footnotes');
});
