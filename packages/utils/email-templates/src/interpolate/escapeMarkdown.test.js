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

import MarkdownIt from 'markdown-it';

import escapeMarkdown from './escapeMarkdown.js';
import escapeMarkdownData from './escapeMarkdownData.js';

test('escapeMarkdown neutralizes markdown links', () => {
  expect(escapeMarkdown('[x](url)')).toEqual('\\[x\\]\\(url\\)');
});

test('escapeMarkdown neutralizes bold markers', () => {
  expect(escapeMarkdown('**b**')).toEqual('\\*\\*b\\*\\*');
});

test('escapeMarkdown neutralizes emphasis markers', () => {
  expect(escapeMarkdown('_i_')).toEqual('\\_i\\_');
});

test('escapeMarkdown neutralizes html tags', () => {
  expect(escapeMarkdown('<b>')).toEqual('\\<b\\>');
});

test('escapeMarkdown neutralizes backticks', () => {
  expect(escapeMarkdown('`code`')).toEqual('\\`code\\`');
});

test('escapeMarkdown neutralizes heading markers', () => {
  expect(escapeMarkdown('# heading')).toEqual('\\# heading');
});

test('escapeMarkdown neutralizes blockquote markers', () => {
  expect(escapeMarkdown('> quote')).toEqual('\\> quote');
});

test('escapeMarkdown neutralizes table pipes', () => {
  expect(escapeMarkdown('a|b')).toEqual('a\\|b');
});

test('escapeMarkdown neutralizes entity smuggling through ampersands', () => {
  expect(escapeMarkdown('&lt;script&gt;')).toEqual('\\&lt\\;script\\&gt\\;');
});

test('escapeMarkdown leaves letters, digits and spaces untouched', () => {
  expect(escapeMarkdown('Hello World 123')).toEqual('Hello World 123');
});

test('escapeMarkdown output renders as literal text through markdown-it', () => {
  const md = new MarkdownIt({ html: false });
  const html = md.render(escapeMarkdown('[click here](https://evil.example) **bold** <script>'));
  expect(html).not.toContain('<a');
  expect(html).not.toContain('<strong>');
  expect(html).not.toContain('<script>');
  expect(html).toContain('[click here](https://evil.example)');
});

test('escapeMarkdownData escapes every string leaf in objects and arrays', () => {
  expect(
    escapeMarkdownData({
      name: '**bold**',
      nested: { text: '[x](url)' },
      list: ['`a`', { deep: '<b>' }],
    })
  ).toEqual({
    name: '\\*\\*bold\\*\\*',
    nested: { text: '\\[x\\]\\(url\\)' },
    list: ['\\`a\\`', { deep: '\\<b\\>' }],
  });
});

test('escapeMarkdownData leaves numbers, booleans, dates and null untouched', () => {
  const date = new Date('2026-01-01T00:00:00.000Z');
  expect(
    escapeMarkdownData({ count: 42, flag: true, date, nothing: null, missing: undefined })
  ).toEqual({ count: 42, flag: true, date, nothing: null, missing: undefined });
});

test('escapeMarkdownData does not mutate the input', () => {
  const data = { name: '**bold**', nested: { text: '[x](url)' } };
  escapeMarkdownData(data);
  expect(data).toEqual({ name: '**bold**', nested: { text: '[x](url)' } });
});
