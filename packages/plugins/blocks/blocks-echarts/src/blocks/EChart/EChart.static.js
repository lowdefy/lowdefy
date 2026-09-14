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
import { type } from '@lowdefy/helpers';
import { toPoints } from '@lowdefy/block-utils/report';

// ECharts has no intrinsic height, so a chart needs an explicit one; 300 is the
// block's documented default.
const DEFAULT_HEIGHT = 300;

// A custom theme object is registered with ECharts once per distinct object and
// reused by name for every later render of that object. The client block does
// the same per blockId; here the theme object itself is the identity, so two
// blocks sharing one theme register it once.
const registeredThemes = new WeakMap();
let themeCounter = 0;

function stillSeries(series) {
  if (type.isArray(series)) {
    return series.map((entry) => (type.isObject(entry) ? { ...entry, animation: false } : entry));
  }
  if (type.isObject(series)) {
    return { ...series, animation: false };
  }
  return series;
}

// Force animation off at the root and on every series: ECharts resolves a
// series' own `animation` over the global flag, so a per-series `animation: true`
// could otherwise leave the SSR frame mid-transition (bars at zero).
function withoutAnimation(option) {
  const base = option ?? {};
  return {
    ...base,
    ...(type.isUndefined(base.series) ? {} : { series: stillSeries(base.series) }),
    animation: false,
  };
}

// The theme name ECharts should init with: a string names a registered theme, an
// object is registered (once) under a generated name, anything else is the
// default light theme.
function resolveTheme(theme) {
  if (type.isString(theme)) return theme;
  if (!type.isObject(theme)) return null;
  if (!registeredThemes.has(theme)) {
    themeCounter += 1;
    const name = `lowdefy_report_theme_${themeCounter}`;
    echarts.registerTheme(name, theme);
    registeredThemes.set(theme, name);
  }
  return registeredThemes.get(theme);
}

/**
 * EChart → `svg`. Render the evaluated `properties.option` to a static SVG via
 * ECharts' zero-DOM SSR path (`init(null, theme, { ssr: true, renderer: 'svg' })`),
 * sized to the resolved column width and the block's `height` (a number or a
 * css length string, as the block accepts). `properties.theme` is honoured the
 * way the block honours it. Animation is forced off so the SVG holds the
 * chart's final frame. A bad option is caught, logged, and skipped (returns
 * `null`) rather than killing the report.
 */
export const EChart = {
  toReport: ({ block, layout, context }) => {
    const width = layout.width;
    const height = toPoints(block.properties?.height) ?? DEFAULT_HEIGHT;

    let chart;
    try {
      chart = echarts.init(null, resolveTheme(block.properties?.theme), {
        renderer: 'svg',
        ssr: true,
        width,
        height,
      });
      chart.setOption(withoutAnimation(block.properties?.option));
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
