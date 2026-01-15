/*
  Copyright 2020-2024 Lowdefy, Inc

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

import { describe, expect, test } from '@jest/globals';

import parseRefContent from './parseRefContent.js';

describe('parseRefContent', () => {
  test('parses YAML content', () => {
    const content = `id: home
type: Box`;
    const result = parseRefContent({ content, refDef: { path: 'test.yaml' } });
    expect(result).toEqual({
      id: 'home',
      type: 'Box',
    });
  });

  test('parses YAML content with arrays', () => {
    const content = `pages:
  - id: home
    type: Box`;
    const result = parseRefContent({ content, refDef: { path: 'test.yaml' } });
    expect(result.pages).toHaveLength(1);
    expect(result.pages[0].id).toBe('home');
  });

  test('adds ~l (line numbers) to YAML objects', () => {
    const content = `id: home
type: Box
properties:
  title: Hello`;
    const result = parseRefContent({ content, refDef: { path: 'test.yaml' } });

    // Root object should have line 1
    expect(result['~l']).toBe(1);

    // Properties object reports line 4 where the nested map content starts,
    // not line 3 where the key "properties:" appears
    expect(result.properties['~l']).toBe(4);
  });

  test('adds ~l (line numbers) to nested objects in arrays', () => {
    const content = `pages:
  - id: home
    type: Box
    blocks:
      - id: header
        type: Title
      - id: content
        type: Paragraph`;
    const result = parseRefContent({ content, refDef: { path: 'test.yaml' } });

    // Root should be line 1
    expect(result['~l']).toBe(1);

    // First page should be line 2
    expect(result.pages[0]['~l']).toBe(2);

    // First block should be line 5
    expect(result.pages[0].blocks[0]['~l']).toBe(5);

    // Second block should be line 7
    expect(result.pages[0].blocks[1]['~l']).toBe(7);
  });

  test('handles deeply nested structures with line numbers', () => {
    const content = `pages:
  - id: home
    type: Box
    blocks:
      - id: container
        type: Box
        blocks:
          - id: inner
            type: Title
            properties:
              content: Hello`;
    const result = parseRefContent({ content, refDef: { path: 'test.yaml' } });

    expect(result['~l']).toBe(1);
    expect(result.pages[0]['~l']).toBe(2);
    expect(result.pages[0].blocks[0]['~l']).toBe(5);
    expect(result.pages[0].blocks[0].blocks[0]['~l']).toBe(8);
    expect(result.pages[0].blocks[0].blocks[0].properties['~l']).toBe(11);
  });

  test('parses JSON content without line numbers', () => {
    const content = '{"id": "home", "type": "Box"}';
    const result = parseRefContent({ content, refDef: { path: 'test.json' } });

    expect(result).toEqual({
      id: 'home',
      type: 'Box',
    });
    // JSON doesn't get line numbers
    expect(result['~l']).toBeUndefined();
  });

  test('returns raw content for unknown extensions', () => {
    const content = 'Hello World';
    const result = parseRefContent({ content, refDef: { path: 'test.txt' } });
    expect(result).toBe('Hello World');
  });

  test('~l property is non-enumerable', () => {
    const content = `id: home
type: Box`;
    const result = parseRefContent({ content, refDef: { path: 'test.yaml' } });

    // ~l exists but is not enumerable
    expect(result['~l']).toBe(1);
    expect(Object.keys(result)).toEqual(['id', 'type']);
    expect(Object.keys(result)).not.toContain('~l');
  });
});
