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

import getLayerBounds from './getLayerBounds.js';

const VIEW_BOX = [0, 0, 100, 80];

function node(tag, props = {}, children = []) {
  return { children, props, tag, Tag: tag };
}

function bounds(nodes, ancestors = []) {
  return getLayerBounds({ layer: { ancestors, nodes }, viewBox: VIEW_BOX });
}

test('getLayerBounds holds a path of moves and lines, with a unit of margin', () => {
  expect(bounds([node('path', { d: 'M10 20h5v4h-5zM30 22h2v2h-2z' })])).toEqual([9, 19, 24, 6]);
});

test('getLayerBounds follows relative commands and the control points of curves', () => {
  expect(bounds([node('path', { d: 'm10 10 l5 5 c0 -8 10 -8 10 0 q5 10 10 0 z' })])).toEqual([
    9, 6, 27, 20,
  ]);
});

test('getLayerBounds holds shapes in groups, padded by half the widest stroke', () => {
  expect(
    bounds([
      node('g', { stroke: '#000', strokeWidth: 4 }, [
        node('rect', { x: 10, y: 10, width: 10, height: 5 }),
        node('circle', { cx: 40, cy: 40, r: 5 }),
      ]),
      node('polygon', { points: '50,50 60,52 55,60' }),
    ])
  ).toEqual([7, 7, 56, 56]);
});

test('getLayerBounds keeps the bounds within the viewBox', () => {
  expect(bounds([node('rect', { x: -5, y: 70, width: 20, height: 20 })])).toEqual([0, 69, 16, 11]);
});

test('getLayerBounds draws the whole viewBox for what it cannot bound', () => {
  expect(bounds([node('path', { d: 'M0 0a5 5 0 0 1 10 0' })])).toBeNull();
  expect(bounds([node('rect', { width: '50%', height: 10 })])).toBeNull();
  expect(bounds([node('text', { x: 1, y: 1 }, ['Hi'])])).toBeNull();
  expect(bounds([node('rect', { transform: 'rotate(10)', width: 4, height: 4 })])).toBeNull();
  expect(
    bounds([node('rect', { width: 4, height: 4 })], [node('g', { transform: 'scale(2)' })])
  ).toBeNull();
  expect(bounds([])).toBeNull();
});
