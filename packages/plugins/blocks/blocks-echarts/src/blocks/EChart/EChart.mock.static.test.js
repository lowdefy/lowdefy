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

// A mocked ECharts lets us assert the renderer's contract with the library
// without a real chart: the forced `animation: false` override, the SSR init
// dimensions, that every chart is disposed, and that a failing option is
// caught, logged, and skipped.

import { jest } from '@jest/globals';

const dispose = jest.fn();
const setOption = jest.fn();
const renderToSVGString = jest.fn(() => '<svg>mock</svg>');
const init = jest.fn(() => ({ setOption, renderToSVGString, dispose }));

jest.unstable_mockModule('echarts', () => ({ init }));

const { EChart } = await import('./EChart.static.js');

function run({ properties = {}, layout = {}, context = {} } = {}) {
  return EChart.toReport({
    block: { id: 'b', blockId: 'chart_1', type: 'EChart', properties },
    layout,
    context,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  renderToSVGString.mockReturnValue('<svg>mock</svg>');
});

test('initialises a zero-DOM SVG SSR chart at the resolved dimensions', () => {
  run({ properties: { option: {}, height: 250 }, layout: { width: 400 } });
  expect(init).toHaveBeenCalledWith(null, null, {
    renderer: 'svg',
    ssr: true,
    width: 400,
    height: 250,
  });
});

test('forces animation off even when the option sets it true', () => {
  run({ properties: { option: { animation: true, series: [] } }, layout: { width: 400 } });
  expect(setOption).toHaveBeenCalledTimes(1);
  const effective = setOption.mock.calls[0][0];
  expect(effective.animation).toBe(false);
  // The option's own contents pass through untouched.
  expect(effective.series).toEqual([]);
});

test('returns an svg node carrying the rendered string and dimensions', () => {
  const node = run({ properties: { option: {} }, layout: { width: 400 } });
  expect(node).toEqual({ kind: 'svg', svg: '<svg>mock</svg>', width: 400, height: 300 });
});

test('disposes the chart after a successful render', () => {
  run({ properties: { option: {} }, layout: { width: 400 } });
  expect(dispose).toHaveBeenCalledTimes(1);
});

test('a malformed option returns null, logs a warning with the blockId, and disposes', () => {
  setOption.mockImplementationOnce(() => {
    throw new Error('bad option');
  });
  const warn = jest.fn();
  const node = run({
    properties: { option: {} },
    layout: { width: 400 },
    context: { logger: { warn } },
  });
  expect(node).toBeNull();
  expect(warn).toHaveBeenCalledTimes(1);
  const [meta, message] = warn.mock.calls[0];
  expect(meta.blockId).toBe('chart_1');
  expect(message).toContain('chart_1');
  expect(dispose).toHaveBeenCalledTimes(1);
});

test('does not leak chart instances across renders — each init is disposed', () => {
  run({ properties: { option: {} }, layout: { width: 400 } });
  run({ properties: { option: {} }, layout: { width: 400 } });
  expect(init).toHaveBeenCalledTimes(2);
  expect(dispose).toHaveBeenCalledTimes(2);
});
