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

import { isBlank, styleValue } from '../../static.utils.js';

// takumi (`@takumi-rs/core`) is a native Rust binding, and its platform binaries
// are optionalDependencies — an unsupported platform installs blocks-basic fine
// but has no binding. Import it lazily (as Icon does with React) so loading this
// module at server boot never touches takumi; only rendering an Html block does,
// and that failure is caught per block.
async function loadTakumi() {
  const [{ Renderer }, { fromHtml }] = await Promise.all([
    import('@takumi-rs/core'),
    import('@takumi-rs/helpers/html'),
  ]);
  return { Renderer, fromHtml };
}

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

// takumi never fetches an image: its `ImageSource` takes caller-supplied bytes
// (2.5.0) and this renderer registers none, so an `<img>` draws nothing and takes
// no space — a logo in a tile just disappears. Warn rather than let it vanish
// silently, and name the block that does load images.
const IMG_PATTERN = /<img[\s/>]/i;

const isNumber = (value) => typeof value === 'number' && Number.isFinite(value);

// One renderer per process: constructing it initialises the Rust engine, and
// takumi caches parsed stylesheets and rasters on the instance, so every Html
// block in every report reuses one parse of the app's compiled CSS.
let renderer;
let fromHtmlFn;
let fontsRegistered;

async function getRenderer() {
  if (!renderer) {
    const { Renderer, fromHtml } = await loadTakumi();
    renderer = new Renderer();
    fromHtmlFn = fromHtml;
  }
  return renderer;
}

/**
 * Register the report fonts with the shared renderer, once. Without fonts
 * takumi has no faces to shape text with, so this must resolve before the
 * first render; with none supplied it stays unregistered and a later render
 * that does carry fonts registers them.
 */
async function registerFonts(fonts) {
  if (fontsRegistered) return fontsRegistered;
  if (!fonts) return undefined;
  const engine = await getRenderer();
  fontsRegistered = Promise.all(
    FONT_FACES.filter(([key]) => fonts[key]).map(([key, weight, style]) =>
      engine.registerFont({ name: FONT_FAMILY, data: fonts[key], weight, style })
    )
  ).catch((error) => {
    // Forget the failure. A cached rejected promise would be handed to every
    // later block in every later report, so one transient failure here would
    // skip every Html block for the life of the process. Rethrow so this block
    // still reports it.
    fontsRegistered = undefined;
    throw error;
  });
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

  if (IMG_PATTERN.test(source)) {
    context?.logger?.warn?.(
      { blockId: block.blockId },
      `${block.type} block '${block.blockId}' contains <img> markup, which reports cannot load — the image draws nothing and takes no space. Use an Img block for report images.`
    );
  }

  const width = isNumber(layout?.width) ? layout.width : DEFAULT_WIDTH;
  // The block's own style height wins over auto-measurement, and is given to
  // takumi so the markup lays out in the box the page would give it.
  const styleHeight = toPoints(styleValue(block.style, 'height'));

  // A block height sizes the canvas, but takumi's root element stays
  // content-height inside it, so `height: 100%` in the markup has no definite
  // parent to resolve against and a bordered tile ends up shorter than the box
  // it was given. Wrapping the markup in a column of that exact height gives it
  // one, which is what an author setting a height means: tiles in a row line up
  // even when one of their labels wraps.
  const markup =
    styleHeight === undefined
      ? source
      : `<div style="display: flex; flex-direction: column; width: ${width}px; height: ${styleHeight}px">${source}</div>`;

  try {
    await registerFonts(context?.fonts);
    const engine = await getRenderer();
    const { node, stylesheets } = fromHtmlFn(markup);
    const svg = await engine.renderSvg(node, {
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
