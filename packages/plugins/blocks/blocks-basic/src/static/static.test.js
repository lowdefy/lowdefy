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

import { validateNode } from '../../../../../reports/src/ir/nodes.js';
import { Img, Span, Box } from './index.js';

// Call a renderer with a `propertiesEval.output`-shaped block projection and
// validate every node it returns against the closed IR validator.
function run(renderer, { properties = {}, children, layout = {}, context = {} } = {}) {
  const result = renderer.toReport({
    block: { id: 'b', blockId: 'b', type: 'X', properties },
    children,
    layout,
    context,
  });
  const nodes = result == null ? [] : Array.isArray(result) ? result : [result];
  nodes.forEach((node) => validateNode(node));
  return result;
}

describe('Img', () => {
  test('maps src to an image node', () => {
    expect(run(Img, { properties: { src: '/logo.png' } })).toEqual({
      kind: 'image',
      src: '/logo.png',
    });
  });

  test('carries numeric width and height through as points', () => {
    expect(run(Img, { properties: { src: 'a.png', width: 120, height: 80 } })).toEqual({
      kind: 'image',
      src: 'a.png',
      width: 120,
      height: 80,
    });
  });

  test('omits non-numeric width and height', () => {
    expect(run(Img, { properties: { src: 'a.png', width: '120' } })).toEqual({
      kind: 'image',
      src: 'a.png',
    });
  });

  test('returns null for a blank src', () => {
    expect(run(Img, { properties: {} })).toBeNull();
    expect(run(Img, { properties: { src: '' } })).toBeNull();
  });
});

describe('Span', () => {
  test('maps content string to text', () => {
    expect(run(Span, { properties: { content: 'Inline' } })).toEqual({
      kind: 'text',
      text: 'Inline',
    });
  });

  test('content wins over children', () => {
    expect(
      run(Span, { properties: { content: 'Inline' }, children: [{ kind: 'text', text: 'kid' }] })
    ).toEqual({
      kind: 'text',
      text: 'Inline',
    });
  });

  test('falls back to a stack of children when no content', () => {
    expect(run(Span, { children: [{ kind: 'text', text: 'kid' }] })).toEqual({
      kind: 'stack',
      children: [{ kind: 'text', text: 'kid' }],
    });
  });

  test('returns null with neither content nor children', () => {
    expect(run(Span, {})).toBeNull();
    expect(run(Span, { children: [] })).toBeNull();
  });
});

describe('Box', () => {
  test('passes children through as a stack', () => {
    expect(
      run(Box, {
        children: [
          { kind: 'text', text: 'a' },
          { kind: 'text', text: 'b' },
        ],
      })
    ).toEqual({
      kind: 'stack',
      children: [
        { kind: 'text', text: 'a' },
        { kind: 'text', text: 'b' },
      ],
    });
  });

  test('maps a content string to text', () => {
    expect(run(Box, { properties: { content: 'Body' } })).toEqual({ kind: 'text', text: 'Body' });
  });

  test('returns null when empty', () => {
    expect(run(Box, {})).toBeNull();
    expect(run(Box, { children: [] })).toBeNull();
  });
});
