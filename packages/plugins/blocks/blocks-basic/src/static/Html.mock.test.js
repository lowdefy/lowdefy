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

// A mocked takumi renderer asserts the renderer's contract with the library,
// which a real render cannot observe: that one `Renderer` serves the whole
// process, that the report fonts register exactly once, and what the
// stylesheet stack and render options look like per block.
//
// The first three tests run in sequence against that process-wide state — the
// mocks are cleared between tests, so each counts only its own render.

import { jest } from '@jest/globals';

const renderSvg = jest.fn(async () => '<svg width="200" height="40"></svg>');
const registerFont = jest.fn(async () => []);
const constructed = jest.fn();

class Renderer {
  constructor(options) {
    constructed(options);
  }
  renderSvg(...args) {
    return renderSvg(...args);
  }
  registerFont(...args) {
    return registerFont(...args);
  }
}

jest.unstable_mockModule('@takumi-rs/core', () => ({ Renderer }));

const { Html } = await import('./Html.js');

const fonts = {
  regular: Buffer.from('regular'),
  bold: Buffer.from('bold'),
  italic: Buffer.from('italic'),
  boldItalic: Buffer.from('boldItalic'),
};

function run({ blockId = 'tile_1', properties = {}, layout = { width: 200 }, context } = {}) {
  return Html.toReport({
    block: { id: blockId, blockId, type: 'Html', properties },
    layout,
    context: context ?? { fonts },
  });
}

test('a render without report fonts constructs the renderer and registers nothing', async () => {
  const node = await run({ properties: { html: '<div>a</div>' }, context: {} });
  expect(constructed).toHaveBeenCalledTimes(1);
  expect(registerFont).not.toHaveBeenCalled();
  expect(node.kind).toBe('svg');
});

test('the first render carrying fonts registers the four report faces', async () => {
  await run({ properties: { html: '<div>a</div>' } });
  expect(registerFont).toHaveBeenCalledTimes(4);
  expect(registerFont.mock.calls.map(([face]) => [face.name, face.weight, face.style])).toEqual([
    ['Roboto', 400, 'normal'],
    ['Roboto', 700, 'normal'],
    ['Roboto', 400, 'italic'],
    ['Roboto', 700, 'italic'],
  ]);
  expect(registerFont.mock.calls[0][0].data).toBe(fonts.regular);
});

test('later blocks reuse the renderer and register no further fonts', async () => {
  await run({ blockId: 'tile_2', properties: { html: '<div>b</div>' } });
  await run({ blockId: 'tile_3', properties: { html: '<div>c</div>' } });
  expect(constructed).not.toHaveBeenCalled();
  expect(registerFont).not.toHaveBeenCalled();
  expect(renderSvg).toHaveBeenCalledTimes(2);
});

test('renders at the column width with the Roboto font stack', async () => {
  await run({ properties: { html: '<div>a</div>' }, layout: { width: 320 } });
  const [, options] = renderSvg.mock.calls.at(-1);
  expect(options.width).toBe(320);
  expect(options.height).toBeUndefined();
  expect(options.fontFamilies).toEqual(['Roboto']);
});

test('stacks the block’s own <style> content ahead of the report CSS', async () => {
  await run({
    properties: { html: '<style>.a{color:#111}</style><div class="a">a</div>' },
    context: { fonts, stylesheets: '.b{color:#222}' },
  });
  const [, options] = renderSvg.mock.calls.at(-1);
  expect(options.stylesheets).toEqual(['.a{color:#111}', '.b{color:#222}']);
});

test('omits an absent report stylesheet from the stack', async () => {
  await run({ properties: { html: '<div>a</div>' } });
  const [, options] = renderSvg.mock.calls.at(-1);
  expect(options.stylesheets).toEqual([]);
});

test('an SVG without dimensions leaves the node height unset', async () => {
  renderSvg.mockResolvedValueOnce('<svg>no dimensions</svg>');
  const node = await run({ properties: { html: '<div>a</div>' } });
  expect(node).toEqual({ kind: 'svg', svg: '<svg>no dimensions</svg>', width: 200 });
});
