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
 * Icon → `svg`. Production KPI tiles pair a number with a movement arrow, so an
 * unrendered Icon costs the report the direction of every trend it shows.
 *
 * The icon components are react-icons functions, taken from `context.icons` —
 * the build's tree-shaken icon artifact, the same map the client resolves names
 * against, so a report can only draw icons the app actually bundles.
 *
 * React renders them: `react` and `react-dom/server` are imported lazily on
 * first use, which keeps the static entry free of React at module load (every
 * report imports this package for Box and Span, but only a page with an Icon
 * pays for React). Serialising the element tree by hand was rejected — react-icons
 * ships React-cased attributes (`fillRule`, `strokeLinecap`, `clipPath`; 457 of
 * them in one icon family alone), so a second serialiser would have to carry its
 * own copy of React's SVG attribute-casing table.
 */

import { type } from '@lowdefy/helpers';

// A line of body text is ~14pt, which is the size an icon beside a label wants.
const DEFAULT_SIZE = 14;
// react-icons paints with `currentColor`; the client inherits the surrounding
// text colour, and a document has none, so fall back to the body text colour.
const DEFAULT_COLOR = '#262626';

let renderer;

// react-dom/server resolves the React-cased attributes and the `currentColor`
// default the same way the browser does. Loaded once per process.
async function getRenderer() {
  if (!renderer) {
    const [{ createElement }, reactDomServer] = await Promise.all([
      import('react'),
      import('react-dom/server'),
    ]);
    const { renderToStaticMarkup } = reactDomServer.default ?? reactDomServer;
    renderer = { createElement, renderToStaticMarkup };
  }
  return renderer;
}

/** A CSS length as points, or undefined when it names no number. */
function toPoints(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return undefined;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

const toReport = async ({ block, context }) => {
  // `properties` may be the icon name alone (`type: Icon, properties: AiFillHome`),
  // exactly as the client's createIcon reads it.
  const properties = type.isString(block.properties)
    ? { name: block.properties }
    : block.properties ?? {};
  const name = properties.name;
  const Component = name ? context?.icons?.[name] : undefined;

  if (!Component) {
    // The page shows a fallback glyph for an unknown name; a document is better
    // off without it, so skip and name the block instead.
    context?.logger?.warn?.(
      { blockId: block.blockId, name },
      `Icon block '${block.blockId}' names icon '${name}', which the app does not bundle. Skipped.`
    );
    return null;
  }

  const size = toPoints(properties.size) ?? toPoints(block.style?.fontSize) ?? DEFAULT_SIZE;
  const color = properties.color ?? block.style?.color ?? DEFAULT_COLOR;

  if (properties.rotate !== undefined || properties.spin === true) {
    context?.logger?.debug?.(
      { blockId: block.blockId },
      `Report icons ignore rotate and spin on block '${block.blockId}'.`
    );
  }

  try {
    const { createElement, renderToStaticMarkup } = await getRenderer();
    const markup = renderToStaticMarkup(
      createElement(Component, { size, color, title: properties.title })
    );
    // pdfmake's SVG renderer has no CSS cascade, so it cannot resolve the
    // keyword react-icons paints with — bake the resolved colour in.
    const svg = markup.split('currentColor').join(color);
    return { kind: 'svg', svg, width: size, height: size };
  } catch (error) {
    context?.logger?.warn?.(
      { blockId: block.blockId, err: error },
      `Icon block '${block.blockId}' failed to render and was skipped: ${error.message}`
    );
    return null;
  }
};

export const Icon = { toReport };
