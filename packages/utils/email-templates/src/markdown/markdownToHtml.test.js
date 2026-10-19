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

import markdownToHtml from './markdownToHtml.js';

test('markdownToHtml renders bold markdown to strong tags', () => {
  const html = markdownToHtml({ markdown: 'A **bold** word' });
  expect(html).toContain('<strong>bold</strong>');
});

test('markdownToHtml escapes raw html to entities', () => {
  const html = markdownToHtml({ markdown: 'Hello <script>alert(1)</script>' });
  expect(html).not.toContain('<script>');
  expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
});

test('markdownToHtml styles links with the default theme color and target blank', () => {
  const html = markdownToHtml({ markdown: '[go](https://example.com)' });
  expect(html).toContain('href="https://example.com"');
  expect(html).toContain('color:#1990ff;');
  expect(html).toContain('target="_blank"');
});

test('markdownToHtml styles links with the theme primary color', () => {
  const html = markdownToHtml({
    markdown: '[go](https://example.com)',
    theme: { primaryColor: '#ff0000' },
  });
  expect(html).toContain('color:#ff0000;');
});

test('markdownToHtml does not autolinkify bare urls', () => {
  const html = markdownToHtml({ markdown: 'Visit https://example.com now' });
  expect(html).not.toContain('<a');
});

test('markdownToHtml adds inline styles to paragraphs', () => {
  const html = markdownToHtml({ markdown: 'Hello' });
  expect(html).toContain('<p style="margin:0 0 16px 0;font-size:14px;line-height:22px;color:#333333;">');
});

test('markdownToHtml adds inline styles to lists and list items', () => {
  const html = markdownToHtml({ markdown: '- one\n- two' });
  expect(html).toContain('<ul style="margin:0 0 16px 0;padding:0 0 0 24px;">');
  expect(html).toContain('<li style="margin:0 0 4px 0;font-size:14px;line-height:22px;color:#333333;">');
});

test('markdownToHtml adds inline styles to blockquotes', () => {
  const html = markdownToHtml({ markdown: '> quoted' });
  expect(html).toContain(
    '<blockquote style="margin:0 0 16px 0;padding:0 0 0 12px;border-left:3px solid #d9d9d9;color:#595959;">'
  );
});

test('markdownToHtml adds inline styles to headings', () => {
  const html = markdownToHtml({ markdown: '# One\n\n## Two\n\n### Three' });
  expect(html).toContain('<h1 style="margin:0 0 16px 0;font-size:22px;line-height:30px;color:#111111;">');
  expect(html).toContain('<h2 style="margin:0 0 16px 0;font-size:18px;line-height:26px;color:#111111;">');
  expect(html).toContain('<h3 style="margin:0 0 12px 0;font-size:16px;line-height:24px;color:#111111;">');
});

test('markdownToHtml converts single newlines to line breaks', () => {
  const html = markdownToHtml({ markdown: 'line one\nline two' });
  expect(html).toContain('<br');
});
