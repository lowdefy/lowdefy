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

import derivePreview from './derivePreview.js';

test('derivePreview returns the explicit preview when set', () => {
  expect(
    derivePreview({ properties: { preview: 'Custom preview', message: '**Ignored**' } })
  ).toBe('Custom preview');
});

test('derivePreview returns null when neither preview nor message is set', () => {
  expect(derivePreview({ properties: {} })).toBe(null);
  expect(derivePreview({ properties: { preview: '', message: '' } })).toBe(null);
  expect(derivePreview({ properties: { preview: 7 } })).toBe(null);
});

test('derivePreview strips emphasis and inline code from the message', () => {
  expect(
    derivePreview({ properties: { message: '**Bold** _italic_ ~~strike~~ `code` end' } })
  ).toBe('Bold italic strike code end');
});

test('derivePreview strips links and images keeping their text', () => {
  expect(
    derivePreview({
      properties: { message: 'See [the docs](https://docs.example) and ![logo](https://cdn/x.png)' },
    })
  ).toBe('See the docs and logo');
});

test('derivePreview strips code fences, headings, blockquotes and list markers', () => {
  expect(
    derivePreview({
      properties: {
        message: '# Heading\n> quoted\n- item one\n* item two\n```\nconst x = 1;\n```\ntail',
      },
    })
  ).toBe('Heading quoted item one item two tail');
});

test('derivePreview unescapes backslash-escaped characters and collapses whitespace', () => {
  expect(derivePreview({ properties: { message: 'Escaped \\[value\\]   and\n\nspace' } })).toBe(
    'Escaped [value] and space'
  );
});

test('derivePreview truncates the derived preview to 140 characters', () => {
  const message = 'a'.repeat(200);
  expect(derivePreview({ properties: { message } })).toHaveLength(140);
});
