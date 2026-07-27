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

/**
 * Html / DangerousHtml → `svg`, rendered by takumi.
 *
 * Reports use Html blocks for custom components — KPI tiles, badges, styled
 * headings — so the report renders the markup rather than skipping it.
 * `@takumi-rs/helpers` `fromHtml` parses the string (extracting any embedded
 * `<style>` sheets) and takumi's Rust engine lays it out — block flow,
 * flexbox, CSS classes, CSS variables — and emits a self-contained SVG with
 * text as paths, which flows through the same `svg` IR node as charts.
 *
 * `DangerousHtml` shares this renderer: sanitization is a client concern, so
 * the report renders the same string the page would (its `DOMPurifyOptions`
 * property has no server-side meaning).
 *
 * NOTE: `toReport` is async here — takumi's whole API is async (`renderSvg`
 * and `registerFont` both return promises; verified against 2.5.0's native
 * bindings and its wasm fallback, neither of which exposes a sync render), so
 * the walker must await renderer results.
 */

import { Renderer } from '@takumi-rs/core';
import { fromHtml } from '@takumi-rs/helpers/html';

import { isBlank } from './utils.js';

// Fallback when the walker gives no column geometry (e.g. a direct unit-test
// call): A4 portrait content width, matching the reports walker default.
const DEFAULT_WIDTH = 515.28;

// The report document font family, registered from `context.fonts` so Html
// text renders in the same face as document text. Named here rather than
// imported so `blocks-basic` stays free of a `@lowdefy/reports` dependency.
const FONT_FAMILY = 'Roboto';

// `context.fonts` key → the CSS weight and style the face answers to, so
// `font-weight: 700` and `font-style: italic` in the markup resolve.
const FONT_FACES = [
  ['regular', 400, 'normal'],
  ['bold', 700, 'normal'],
  ['italic', 400, 'italic'],
  ['boldItalic', 700, 'italic'],
];

// takumi has no table layout algorithm — `<table>` cells run on inline even
// with `display: table` — so the block renders, mislaid out, with this
// warning naming the config-side fix.
const TABLE_PATTERN = /<table[\s/>]/i;

const isNumber = (value) => typeof value === 'number' && Number.isFinite(value);

// One renderer per process: constructing it initialises the Rust engine, and
// takumi caches parsed stylesheets and rasters on the instance, so every Html
// block in every report reuses one parse of the app's compiled CSS.
let renderer;
let fontsRegistered;

function getRenderer() {
  if (!renderer) renderer = new Renderer();
  return renderer;
}

/**
 * Register the report fonts with the shared renderer, once. Without fonts
 * takumi has no faces to shape text with, so this must resolve before the
 * first render; with none supplied it stays unregistered and a later render
 * that does carry fonts registers them.
 */
function registerFonts(fonts) {
  if (fontsRegistered) return fontsRegistered;
  if (!fonts) return Promise.resolve();
  const engine = getRenderer();
  fontsRegistered = Promise.all(
    FONT_FACES.filter(([key]) => fonts[key]).map(([key, weight, style]) =>
      engine.registerFont({ name: FONT_FAMILY, data: fonts[key], weight, style })
    )
  );
  return fontsRegistered;
}

/** A CSS length as points, or undefined when it names no number. */
function toPoints(value) {
  if (isNumber(value)) return value;
  if (typeof value !== 'string') return undefined;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/** The height takumi measured, read off the SVG root it just wrote. */
function measuredHeight(svg) {
  const match = /^<svg[^>]*\sheight="([\d.]+)"/.exec(svg);
  return match ? Number.parseFloat(match[1]) : undefined;
}

const toReport = async ({ block, layout, context }) => {
  const html = block.properties?.html;
  if (isBlank(html)) return null;
  const source = String(html);

  if (TABLE_PATTERN.test(source)) {
    context?.logger?.warn?.(
      { blockId: block.blockId },
      `${block.type} block '${block.blockId}' contains <table> markup, which reports cannot lay out — cells run on inline. Use flex markup, or a table block, for tabular report content.`
    );
  }

  const width = isNumber(layout?.width) ? layout.width : DEFAULT_WIDTH;
  // The block's own style height wins over auto-measurement, and is given to
  // takumi so the markup lays out in the box the page would give it.
  const styleHeight = toPoints(block.style?.height);

  try {
    await registerFonts(context?.fonts);
    const { node, stylesheets } = fromHtml(source);
    const svg = await getRenderer().renderSvg(node, {
      width,
      ...(styleHeight !== undefined ? { height: styleHeight } : {}),
      // The block's own `<style>` content first, then the report's compiled
      // CSS (the app's Tailwind pass plus `public/styles.css`), which is
      // absent for an app with neither.
      stylesheets: [...stylesheets, context?.stylesheets].filter(
        (sheet) => typeof sheet === 'string' && sheet !== ''
      ),
      fontFamilies: [FONT_FAMILY],
    });
    const height = styleHeight ?? measuredHeight(svg);
    // Markup that measures to nothing (an empty div, a comment) has nothing to
    // draw, and a zero-height node would still take its margin in the PDF.
    if (height === 0) return null;
    return { kind: 'svg', svg, width, ...(height !== undefined ? { height } : {}) };
  } catch (error) {
    context?.logger?.warn?.(
      { blockId: block.blockId, err: error },
      `${block.type} block '${block.blockId}' failed to render and was skipped: ${error.message}`
    );
    return null;
  }
};

export const Html = { toReport };

/** DangerousHtml renders through the same engine, from the same property. */
export const DangerousHtml = Html;
