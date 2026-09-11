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

import { Img, Span, Box } from './static.js';

// Call a renderer with a `propertiesEval.output`-shaped block projection and
// walked `areas`.
function run(renderer, { properties = {}, areas, layout = { width: 515, fraction: 1 } } = {}) {
  return renderer.toReport({
    block: { id: 'b', blockId: 'b', type: 'X', properties },
    areas,
    layout,
    context: {},
  });
}

const text = (t) => ({ kind: 'text', text: t });

describe('Img', () => {
  test('Img maps src to an image node', () => {
    expect(run(Img, { properties: { src: '/logo.png' } })).toEqual({
      kind: 'image',
      src: '/logo.png',
    });
  });

  test('Img carries numeric width and height through as points', () => {
    expect(run(Img, { properties: { src: 'a.png', width: 120, height: 80 } })).toEqual({
      kind: 'image',
      src: 'a.png',
      width: 120,
      height: 80,
    });
  });

  test('Img omits non-numeric width and height', () => {
    expect(run(Img, { properties: { src: 'a.png', width: '120' } })).toEqual({
      kind: 'image',
      src: 'a.png',
    });
  });

  test('Img returns null for a blank src', () => {
    expect(run(Img, { properties: {} })).toBeNull();
    expect(run(Img, { properties: { src: '' } })).toBeNull();
  });
});

describe('Span', () => {
  test('Span maps a content string to text with markup flattened', () => {
    expect(run(Span, { properties: { content: 'In<b>line</b>' } })).toEqual(text('Inline'));
  });

  test('Span content wins over the content area, as on the page', () => {
    expect(
      run(Span, { properties: { content: 'Inline' }, areas: { content: [text('kid')] } })
    ).toEqual(text('Inline'));
  });

  test('Span falls back to a stack of its content area when no content string', () => {
    expect(run(Span, { areas: { content: [text('kid')] } })).toEqual({
      kind: 'stack',
      children: [text('kid')],
    });
  });

  test('Span returns null with neither content nor area blocks', () => {
    expect(run(Span, {})).toBeNull();
    expect(run(Span, { areas: { content: [] } })).toBeNull();
  });
});

describe('Box', () => {
  test('Box passes its content area through as a stack', () => {
    expect(run(Box, { areas: { content: [text('a'), text('b')] } })).toEqual({
      kind: 'stack',
      children: [text('a'), text('b')],
    });
  });

  test('Box maps a content string to text with markup flattened', () => {
    expect(run(Box, { properties: { content: '<p>Body</p>' } })).toEqual(text('Body'));
  });

  test('Box returns null when empty', () => {
    expect(run(Box, {})).toBeNull();
    expect(run(Box, { areas: { content: [] } })).toBeNull();
  });
});
