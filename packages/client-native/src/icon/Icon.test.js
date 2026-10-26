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

import React from 'react';
import { render, screen } from '@testing-library/react-native';

import Icon from './Icon.js';

// lucide's House, as the build loads it: React attribute names on a 24px view box.
const house = {
  node: [
    ['path', { d: 'M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8' }],
    ['path', { d: 'M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9z' }],
  ],
};

function findAll(node, predicate, found = []) {
  if (node === null || typeof node === 'string') return found;
  if (predicate(node)) found.push(node);
  (node.children ?? []).forEach((child) => findAll(child, predicate, found));
  return found;
}

test('Icon draws IconData nodes with the web icon defaults', async () => {
  await render(<Icon color="#123456" data={house} testID="icon" />);
  const svg = screen.getByTestId('icon');
  expect(svg.props.width).toBe(24);
  expect(svg.props.height).toBe(24);
  expect(svg.props.color).toBe('#123456');
  const paths = findAll(svg, (node) => node.props?.d !== undefined);
  expect(paths.map((path) => path.props.d)).toEqual(house.node.map(([, attrs]) => attrs.d));
});

test('Icon takes a set layer attrs over the defaults and a size over the icon size', async () => {
  const filled = {
    attrs: { fill: 'currentColor', stroke: 'none', viewBox: '0 0 16 16' },
    node: [['circle', { cx: 8, cy: 8, r: 6 }]],
    size: 16,
  };
  await render(<Icon data={filled} testID="small" />);
  expect(screen.getByTestId('small').props.width).toBe(16);
  await render(<Icon data={filled} size={32} testID="large" />);
  const large = screen.getByTestId('large');
  expect(large.props.width).toBe(32);
  expect(findAll(large, (node) => node.props?.r === 6)).not.toHaveLength(0);
});

test('Icon leaves out tags that draw nothing on a phone', async () => {
  const titled = {
    node: [
      ['title', {}, []],
      ['g', {}, [['rect', { x: 2, y: 2, width: 20, height: 20 }]]],
    ],
  };
  await render(<Icon data={titled} testID="titled" />);
  const svg = screen.getByTestId('titled');
  expect(findAll(svg, (node) => node.props?.x === 2)).not.toHaveLength(0);
});
