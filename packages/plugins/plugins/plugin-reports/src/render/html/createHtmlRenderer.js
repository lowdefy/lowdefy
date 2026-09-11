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

import { type } from '@lowdefy/helpers';

import { FONT_FAMILY, SYMBOL_FONT_FAMILY } from '../../fonts/fonts.js';
import getEngine from './getEngine.js';
import measuredHeight from './measuredHeight.js';
import registerFonts from './registerFonts.js';
import wrapInBox from './wrapInBox.js';

/**
 * Build the `renderHtml` function handed to block renderers through the render
 * context. Reports use Html blocks for custom components — KPI tiles, badges,
 * styled headings — so the report renders the markup rather than skipping it.
 * `@takumi-rs/helpers` `fromHtml` parses the string (extracting any embedded
 * `<style>` sheets) and takumi's Rust engine lays it out — block flow, flexbox,
 * CSS classes, CSS variables — and emits a self-contained SVG with text as
 * paths, which flows through the same `svg` IR node as charts.
 *
 * The plugin owns the engine, the report fonts and the compiled stylesheet, so
 * a block package never depends on takumi; a renderer only supplies markup and
 * geometry. Failures throw — the block renderer decides how to degrade.
 *
 * @param {object} options
 * @param {object} options.fonts The report font Buffers (`fonts/fonts.js`).
 * @param {string} [options.stylesheets] The build's compiled report CSS.
 * @returns {(input: { html: string, width: number, height?: number }) =>
 *   Promise<{ svg: string, height: number|undefined }>}
 */
function createHtmlRenderer({ fonts, stylesheets }) {
  return async function renderHtml({ html, width, height }) {
    const { renderer, fromHtml } = await getEngine();
    await registerFonts({ renderer, fonts });
    const { node, stylesheets: inlineSheets } = fromHtml(wrapInBox({ html, width, height }));
    const svg = await renderer.renderSvg(node, {
      width,
      ...(height !== undefined ? { height } : {}),
      // The block's own <style> content first, then the report's compiled CSS
      // (the app's Tailwind pass plus public/styles.css), absent for an app with
      // neither.
      stylesheets: [...inlineSheets, stylesheets].filter(
        (sheet) => type.isString(sheet) && sheet !== ''
      ),
      fontFamilies: [FONT_FAMILY, SYMBOL_FONT_FAMILY],
    });
    return { svg, height: height ?? measuredHeight(svg) };
  };
}

export default createHtmlRenderer;
