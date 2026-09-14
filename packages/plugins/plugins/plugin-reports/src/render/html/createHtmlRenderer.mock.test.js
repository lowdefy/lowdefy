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
// which a real render cannot observe: that one Renderer serves the whole
// process, that the report fonts register exactly once, and what the stylesheet
// stack and render options look like per call.
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

const { default: createHtmlRenderer } = await import('./createHtmlRenderer.js');

const fonts = {
  regular: Buffer.from('regular'),
  bold: Buffer.from('bold'),
  italic: Buffer.from('italic'),
  boldItalic: Buffer.from('boldItalic'),
};

test('a render without report fonts constructs the renderer and registers nothing', async () => {
  const renderHtml = createHtmlRenderer({});
  const result = await renderHtml({ html: '<div>a</div>', width: 200 });
  expect(constructed).toHaveBeenCalledTimes(1);
  expect(registerFont).not.toHaveBeenCalled();
  expect(result.svg).toContain('<svg');
});

test('the first render carrying fonts registers the four report faces', async () => {
  const renderHtml = createHtmlRenderer({ fonts });
  await renderHtml({ html: '<div>a</div>', width: 200 });
  expect(registerFont).toHaveBeenCalledTimes(4);
  expect(registerFont.mock.calls.map(([face]) => [face.name, face.weight, face.style])).toEqual([
    ['Roboto', 400, 'normal'],
    ['Roboto', 700, 'normal'],
    ['Roboto', 400, 'italic'],
    ['Roboto', 700, 'italic'],
  ]);
  expect(registerFont.mock.calls[0][0].data).toBe(fonts.regular);
});

test('later renders reuse the engine and register no further fonts', async () => {
  const renderHtml = createHtmlRenderer({ fonts });
  await renderHtml({ html: '<div>b</div>', width: 200 });
  await renderHtml({ html: '<div>c</div>', width: 200 });
  expect(constructed).not.toHaveBeenCalled();
  expect(registerFont).not.toHaveBeenCalled();
  expect(renderSvg).toHaveBeenCalledTimes(2);
});

test('renders at the given width with the Roboto font stack and no height', async () => {
  const renderHtml = createHtmlRenderer({ fonts });
  await renderHtml({ html: '<div>a</div>', width: 320 });
  const [, options] = renderSvg.mock.calls.at(-1);
  expect(options.width).toBe(320);
  expect(options.height).toBeUndefined();
  expect(options.fontFamilies).toEqual(['Roboto']);
});

test('a given height is passed to the engine', async () => {
  const renderHtml = createHtmlRenderer({ fonts });
  const result = await renderHtml({ html: '<div>a</div>', width: 320, height: 90 });
  const [, options] = renderSvg.mock.calls.at(-1);
  expect(options.height).toBe(90);
  expect(result.height).toBe(90);
});

test('stacks the markup’s own <style> content ahead of the report CSS', async () => {
  const renderHtml = createHtmlRenderer({ fonts, stylesheets: '.b{color:#222}' });
  await renderHtml({ html: '<style>.a{color:#111}</style><div class="a">a</div>', width: 200 });
  const [, options] = renderSvg.mock.calls.at(-1);
  expect(options.stylesheets).toEqual(['.a{color:#111}', '.b{color:#222}']);
});

test('omits an absent report stylesheet from the stack', async () => {
  const renderHtml = createHtmlRenderer({ fonts });
  await renderHtml({ html: '<div>a</div>', width: 200 });
  const [, options] = renderSvg.mock.calls.at(-1);
  expect(options.stylesheets).toEqual([]);
});

test('an SVG without dimensions leaves the height undefined', async () => {
  renderSvg.mockResolvedValueOnce('<svg>no dimensions</svg>');
  const renderHtml = createHtmlRenderer({ fonts });
  const result = await renderHtml({ html: '<div>a</div>', width: 200 });
  expect(result).toEqual({ svg: '<svg>no dimensions</svg>', height: undefined });
});
