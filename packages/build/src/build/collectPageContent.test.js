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

import collectPageContent from './collectPageContent.js';

test('collectPageContent returns empty string when no pages', () => {
  expect(collectPageContent([])).toBe('');
});

test('collectPageContent returns empty string for empty pages array', () => {
  expect(collectPageContent([])).toBe('');
});

test('collectPageContent returns empty string for undefined pages', () => {
  expect(collectPageContent(undefined)).toBe('');
});

test('collectPageContent collects string from properties.html', () => {
  const result = collectPageContent([
    { id: 'p1', type: 'DangerousHtml', properties: { html: '<div class="bg-red-500">Hello</div>' } },
  ]);
  expect(result).toBe('<div class="bg-red-500">Hello</div>');
});

test('collectPageContent collects string from properties.content', () => {
  const result = collectPageContent([
    { id: 'p1', type: 'Markdown', properties: { content: '# Title' } },
  ]);
  expect(result).toBe('# Title');
});

test('collectPageContent collects multiple string properties from one block', () => {
  const result = collectPageContent([
    {
      id: 'p1',
      type: 'Box',
      properties: { title: 'Hello', subtitle: 'World' },
    },
  ]);
  expect(result).toContain('Hello');
  expect(result).toContain('World');
});

test('collectPageContent collects strings from nested blocks via blocks', () => {
  const result = collectPageContent([
    {
      id: 'p1',
      type: 'Box',
      properties: { title: 'Parent' },
      blocks: [
        { id: 'c1', type: 'Text', properties: { content: 'Child' } },
      ],
    },
  ]);
  expect(result).toContain('Parent');
  expect(result).toContain('Child');
});

test('collectPageContent collects strings from blocks in areas.content.blocks', () => {
  const result = collectPageContent([
    {
      id: 'p1',
      type: 'Box',
      areas: {
        content: {
          blocks: [
            { id: 'c1', type: 'Text', properties: { content: 'In area' } },
          ],
        },
      },
    },
  ]);
  expect(result).toContain('In area');
});

test('collectPageContent collects strings from blocks in slots.header.blocks', () => {
  const result = collectPageContent([
    {
      id: 'p1',
      type: 'Card',
      slots: {
        header: {
          blocks: [
            { id: 'h1', type: 'Title', properties: { content: 'Header text' } },
          ],
        },
      },
    },
  ]);
  expect(result).toContain('Header text');
});

test('collectPageContent descends into nested objects in properties', () => {
  const result = collectPageContent([
    {
      id: 'p1',
      type: 'Selector',
      properties: {
        options: [{ label: 'hello', value: 'h' }, { label: 'world', value: 'w' }],
      },
    },
  ]);
  expect(result).toContain('hello');
  expect(result).toContain('world');
  expect(result).toContain('h');
  expect(result).toContain('w');
});

test('collectPageContent collects strings from runtime operator branches', () => {
  const result = collectPageContent([
    {
      id: 'p1',
      type: 'DangerousHtml',
      properties: {
        html: {
          _if: {
            test: { _state: 'x' },
            then: '<div class="bg-red-500">',
            else: '<div class="bg-blue-500">',
          },
        },
      },
    },
  ]);
  expect(result).toContain('<div class="bg-red-500">');
  expect(result).toContain('<div class="bg-blue-500">');
});

test('collectPageContent ignores non-string values', () => {
  const result = collectPageContent([
    {
      id: 'p1',
      type: 'Box',
      properties: {
        count: 42,
        visible: true,
        empty: null,
        title: 'Keep this',
      },
    },
  ]);
  expect(result).toBe('Keep this');
});

test('collectPageContent skips blocks without properties', () => {
  const result = collectPageContent([
    { id: 'p1', type: 'Box' },
    { id: 'p2', type: 'Text', properties: { content: 'Has props' } },
  ]);
  expect(result).toBe('Has props');
});
