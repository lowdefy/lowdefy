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

import { jest } from '@jest/globals';
import { createElement } from 'react';

import { Icon } from './Icon.static.js';

// A stand-in shaped like a react-icons component: `currentColor` paint, a
// React-cased attribute (which only renders correctly through React), and the
// size/color/title props react-icons accepts.
const ArrowUp = ({ size, color, title }) =>
  createElement(
    'svg',
    {
      viewBox: '0 0 1024 1024',
      width: size,
      height: size,
      fill: 'currentColor',
      stroke: 'currentColor',
      style: { color },
    },
    title ? createElement('title', null, title) : null,
    createElement('path', { d: 'M868 545L536 163 156 545z', fillRule: 'evenodd' })
  );

function makeContext({ icons = { ArrowUp } } = {}) {
  return {
    icons,
    logger: { warn: jest.fn(), debug: jest.fn(), info: jest.fn() },
  };
}

async function run({ properties, style, context = makeContext() } = {}) {
  const result = await Icon.toReport({
    block: { id: 'i', blockId: 'delta_arrow', type: 'Icon', properties, style },
    context,
  });
  return { result, context };
}

test('renders the named icon as an svg node sized in points', async () => {
  const { result } = await run({ properties: { name: 'ArrowUp', size: 12 } });
  expect(result).toMatchObject({ kind: 'svg', width: 12, height: 12 });
  expect(result.svg).toContain('<svg');
  expect(result.svg).toContain('width="12"');
});

test('bakes the resolved colour in, since pdfmake cannot resolve currentColor', async () => {
  const { result } = await run({ properties: { name: 'ArrowUp', color: '#237804' } });
  expect(result.svg).not.toContain('currentColor');
  expect(result.svg).toContain('#237804');
});

test('defaults the colour to body text and the size to a line of text', async () => {
  const { result } = await run({ properties: { name: 'ArrowUp' } });
  expect(result).toMatchObject({ width: 14, height: 14 });
  expect(result.svg).toContain('#262626');
});

test('React renders React-cased attributes as real SVG attributes', async () => {
  const { result } = await run({ properties: { name: 'ArrowUp' } });
  expect(result.svg).toContain('fill-rule="evenodd"');
  expect(result.svg).not.toContain('fillRule');
});

test('properties may be the icon name alone', async () => {
  const { result } = await run({ properties: 'ArrowUp' });
  expect(result.kind).toBe('svg');
});

test('block style supplies the colour and size when properties do not', async () => {
  const { result } = await run({
    properties: { name: 'ArrowUp' },
    style: { color: '#cf1322', fontSize: '20px' },
  });
  expect(result).toMatchObject({ width: 20, height: 20 });
  expect(result.svg).toContain('#cf1322');
});

test('a title renders for accessibility', async () => {
  const { result } = await run({ properties: { name: 'ArrowUp', title: 'Up' } });
  expect(result.svg).toContain('<title>Up</title>');
});

test('an icon the app does not bundle skips with a warning naming the block', async () => {
  const { result, context } = await run({ properties: { name: 'AiOutlineMissing' } });
  expect(result).toBeNull();
  expect(context.logger.warn).toHaveBeenCalledTimes(1);
  expect(context.logger.warn.mock.calls[0][1]).toContain("Icon block 'delta_arrow'");
  expect(context.logger.warn.mock.calls[0][1]).toContain('AiOutlineMissing');
});

test('no name at all skips rather than drawing a fallback glyph', async () => {
  const { result } = await run({ properties: {} });
  expect(result).toBeNull();
});

test('rotate and spin are logged as ignored', async () => {
  const { context } = await run({ properties: { name: 'ArrowUp', rotate: 90, spin: true } });
  expect(context.logger.debug).toHaveBeenCalledTimes(1);
  expect(context.logger.debug.mock.calls[0][1]).toContain('rotate and spin');
});

test('a throwing icon component skips with a warning', async () => {
  const Broken = () => {
    throw new Error('bad icon');
  };
  const { result, context } = await run({
    properties: { name: 'Broken' },
    context: makeContext({ icons: { Broken } }),
  });
  expect(result).toBeNull();
  expect(context.logger.warn.mock.calls[0][1]).toContain('failed to render');
});
