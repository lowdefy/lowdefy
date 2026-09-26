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

import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

import convertGenIcon from './convertGenIcon.js';
import parseGenIconSource from './parseGenIconSource.js';

const require = createRequire(import.meta.url);
const reactIconsDirectory = path.dirname(require.resolve('react-icons'));

function tree(pack, name) {
  const source = fs.readFileSync(path.join(reactIconsDirectory, pack, 'index.mjs'), 'utf8');
  return parseGenIconSource({ source })[name];
}

test('convertGenIcon converts a flat Lucide icon to nodes with no size or attrs', () => {
  const iconData = convertGenIcon({ tree: tree('lu', 'LuPencil'), defaultViewBox: '0 0 24 24' });
  expect(iconData).toEqual({
    node: [
      [
        'path',
        {
          d: 'M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z',
        },
      ],
      ['path', { d: 'm15 5 4 4' }],
    ],
  });
});

test('convertGenIcon turns the zero stroke width of a filled Ai icon into stroke none', () => {
  const iconData = convertGenIcon({
    tree: tree('ai', 'AiOutlineUser'),
    defaultViewBox: '0 0 1024 1024',
  });
  expect(iconData.size).toBe(1024);
  expect(iconData.attrs).toEqual({ fill: 'currentColor', stroke: 'none' });
  expect(iconData.node).toHaveLength(1);
  expect(iconData.node[0][0]).toBe('path');
});

test('convertGenIcon keeps the nesting of a ci icon', () => {
  const iconData = convertGenIcon({ tree: tree('ci', 'CiEdit'), defaultViewBox: '0 0 24 24' });
  expect(iconData.size).toBeUndefined();
  const [tag, attrs, children] = iconData.node[0];
  expect(tag).toBe('g');
  expect(attrs).toEqual({ id: 'Edit' });
  expect(children[0][0]).toBe('g');
  expect(children[0][2].map(([childTag]) => childTag)).toEqual(['path', 'path']);
});

test('convertGenIcon wraps an icon with a non-zero viewBox origin in a translating group', () => {
  const iconData = convertGenIcon({ tree: tree('fc', 'FcLinux'), defaultViewBox: '0 0 48 48' });
  expect(iconData.size).toBe(48);
  expect(iconData.node).toHaveLength(1);
  const [tag, attrs, children] = iconData.node[0];
  expect(tag).toBe('g');
  expect(attrs).toEqual({ transform: 'translate(0 -2)' });
  expect(children.length).toBeGreaterThan(1);
});

test('convertGenIcon gives a non-square icon width and height', () => {
  const iconData = convertGenIcon({
    tree: tree('fa', 'FaWhatsapp'),
    defaultViewBox: '0 0 512 512',
  });
  expect(iconData.width).toBe(448);
  expect(iconData.height).toBe(512);
  expect(iconData.size).toBeUndefined();
});

test('convertGenIcon uses the default viewBox when the icon has none', () => {
  const iconData = convertGenIcon({
    tree: tree('vsc', 'VscKebabVertical'),
    defaultViewBox: '0 0 16 16',
  });
  expect(iconData.size).toBe(16);
  expect(iconData.attrs).toEqual({ fill: 'currentColor', stroke: 'none' });
});

test('convertGenIcon drops a non-zero root stroke width and keeps per-node stroke widths', () => {
  const iconData = convertGenIcon({
    tree: {
      tag: 'svg',
      attr: { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '1.5' },
      child: [{ tag: 'path', attr: { d: 'M1 1h2', strokeWidth: '3' }, child: [] }],
    },
    defaultViewBox: '0 0 24 24',
  });
  expect(iconData).toEqual({ node: [['path', { d: 'M1 1h2', strokeWidth: '3' }]] });
});

test('convertGenIcon converts attribute names to React names', () => {
  const iconData = convertGenIcon({
    tree: {
      tag: 'svg',
      attr: { viewBox: '0 0 24 24', 'fill-rule': 'evenodd' },
      child: [
        {
          tag: 'use',
          attr: { class: 'a', 'clip-rule': 'evenodd', 'xlink:href': '#b', 'data-x': '1' },
          child: [],
        },
      ],
    },
    defaultViewBox: '0 0 24 24',
  });
  expect(iconData).toEqual({
    node: [['use', { className: 'a', clipRule: 'evenodd', xlinkHref: '#b', 'data-x': '1' }]],
    attrs: { fill: 'currentColor', fillRule: 'evenodd', stroke: 'none' },
  });
});

test('convertGenIcon drops root document attributes', () => {
  const iconData = convertGenIcon({
    tree: {
      tag: 'svg',
      attr: {
        viewBox: '0 0 30 30',
        version: '1.1',
        id: 'Layer_1',
        x: '0px',
        y: '0px',
        style: 'enable-background:new 0 0 30 30;',
        enableBackground: 'new 0 0 30 30',
        xmlns: 'http://www.w3.org/2000/svg',
        role: 'img',
        'aria-hidden': 'true',
        width: '30',
        height: '30',
      },
      child: [{ tag: 'path', attr: { d: 'M1 1h2' }, child: [] }],
    },
    defaultViewBox: '0 0 24 24',
  });
  expect(iconData).toEqual({
    node: [['path', { d: 'M1 1h2' }]],
    size: 30,
    attrs: { fill: 'currentColor', stroke: 'none' },
  });
});
