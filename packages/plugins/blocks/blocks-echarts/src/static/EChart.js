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

import * as echarts from 'echarts';

// Fallback when the walker gives no column geometry (e.g. a direct unit-test
// call): A4 portrait content width, matching the reports walker default.
const DEFAULT_WIDTH = 515.28;
// ECharts has no intrinsic height, so a chart needs an explicit one; 300pt is
// the block's documented default.
const DEFAULT_HEIGHT = 300;

const isNumber = (value) => typeof value === 'number' && Number.isFinite(value);

/**
 * EChart → `svg`. Render the evaluated `properties.option` to a static SVG via
 * ECharts' zero-DOM SSR path (`init(null, …, { ssr: true, renderer: 'svg' })`),
 * sized to the resolved column width and the block's `height`. The default
 * (unregistered) ECharts theme is the light theme the fidelity contract wants;
 * the option's own colours pass through untouched. Animation is forced off so
 * the SVG holds the chart's final frame. A bad option is caught, logged, and
 * skipped (returns `null`) rather than killing the report.
 */
export const EChart = {
  toReport: ({ block, layout, context }) => {
    const width = isNumber(layout?.width) ? layout.width : DEFAULT_WIDTH;
    const height = isNumber(block.properties?.height) ? block.properties.height : DEFAULT_HEIGHT;

    let chart;
    try {
      chart = echarts.init(null, null, { renderer: 'svg', ssr: true, width, height });
      // Spread the override last so `animation: false` wins even when the
      // option sets it true.
      chart.setOption({ ...block.properties?.option, animation: false });
      const svg = chart.renderToSVGString();
      return { kind: 'svg', svg, width, height };
    } catch (error) {
      context?.logger?.warn?.(
        { blockId: block.blockId, err: error },
        `EChart '${block.blockId}' failed to render and was skipped: ${error.message}`
      );
      return null;
    } finally {
      chart?.dispose();
    }
  },
};
