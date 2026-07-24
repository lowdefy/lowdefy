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

// This suite renders with the real ECharts SSR path to prove the renderer
// produces a valid static SVG at the requested dimensions. Structural
// behaviour (animation override, dispose, error handling) is covered against a
// mocked ECharts in EChart.mock.test.js.

import { EChart } from './EChart.js';

const barOption = {
  xAxis: { type: 'category', data: ['a', 'b', 'c'] },
  yAxis: { type: 'value' },
  series: [{ type: 'bar', data: [1, 2, 3] }],
};

function run({ properties = {}, layout = {}, context = {} } = {}) {
  return EChart.toReport({
    block: { id: 'b', blockId: 'b', type: 'EChart', properties },
    layout,
    context,
  });
}

test('renders a bar-chart option to an svg node at the requested dimensions', () => {
  const node = run({ properties: { option: barOption }, layout: { width: 400 } });
  expect(node.kind).toBe('svg');
  expect(node.width).toBe(400);
  expect(node.height).toBe(300);
  expect(node.svg).toContain('<svg');
  expect(node.svg).toContain('<rect');
  expect(node.svg).toContain('width="400"');
  expect(node.svg).toContain('height="300"');
});

test('uses properties.height and the resolved column width', () => {
  const node = run({ properties: { option: barOption, height: 250 }, layout: { width: 512 } });
  expect(node.width).toBe(512);
  expect(node.height).toBe(250);
  expect(node.svg).toContain('height="250"');
});

test('falls back to the default width and height when none are given', () => {
  const node = run({ properties: { option: barOption } });
  expect(node.width).toBeCloseTo(515.28);
  expect(node.height).toBe(300);
  expect(node.svg).toContain('<svg');
});
