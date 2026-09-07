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
 * Html / DangerousHtml → `svg`.
 *
 * Reports use Html blocks for custom components (KPI tiles, badges, styled
 * headings), so the report renders the markup rather than skipping it. The
 * layout engine belongs to the reports plugin, which hands it in as
 * `context.renderHtml`: this renderer only decides the box (the column width
 * and the block's own style height) and reports what the engine cannot draw.
 * Keeping the engine out of this package means an app that never renders a
 * report installs no native layout binary for its Html blocks.
 *
 * `DangerousHtml` shares this renderer: sanitization is a client concern, so
 * the report renders the same string the page would.
 */

import { type } from '@lowdefy/helpers';
import { isBlank, styleValue, toPoints } from '@lowdefy/block-utils/report';

// The html engine has no table layout algorithm, so `<table>` cells run on
// inline. The block renders, mislaid out, with this warning naming the fix.
const TABLE_PATTERN = /<table[\s/>]/i;

// The html engine never fetches an image, so an `<img>` draws nothing and takes
// no space. Warn rather than let a logo vanish silently.
const IMG_PATTERN = /<img[\s/>]/i;

let missingRendererWarned = false;

function warnMissingRenderer({ block, context }) {
  if (missingRendererWarned) return;
  missingRendererWarned = true;
  context?.logger?.warn?.(
    { blockId: block.blockId },
    `${block.type} block '${block.blockId}' skipped: the reports plugin supplied no html renderer (context.renderHtml). Html blocks render only through @lowdefy/plugin-reports.`
  );
}

const toReport = async ({ block, layout, context }) => {
  const html = block.properties?.html;
  if (isBlank(html)) return null;
  const source = String(html);

  if (!type.isFunction(context?.renderHtml)) {
    warnMissingRenderer({ block, context });
    return null;
  }

  if (TABLE_PATTERN.test(source)) {
    context.logger?.warn?.(
      { blockId: block.blockId },
      `${block.type} block '${block.blockId}' contains <table> markup, which reports cannot lay out: cells run on inline. Use flex markup, or a table block, for tabular report content.`
    );
  }

  if (IMG_PATTERN.test(source)) {
    context.logger?.warn?.(
      { blockId: block.blockId },
      `${block.type} block '${block.blockId}' contains <img> markup, which reports cannot load: the image draws nothing and takes no space. Use an Img block for report images.`
    );
  }

  const width = layout.width;
  // The block's own style height wins over auto-measurement, so tiles in a row
  // line up even when one label wraps.
  const styleHeight = toPoints(styleValue(block.style, 'height'));

  try {
    const { svg, height } = await context.renderHtml({ html: source, width, height: styleHeight });
    // Markup that measures to nothing (an empty div, a comment) has nothing to
    // draw, and a zero-height node would still take its margin in the PDF.
    if (height === 0) return null;
    return { kind: 'svg', svg, width, height };
  } catch (error) {
    context.logger?.warn?.(
      { blockId: block.blockId, err: error },
      `${block.type} block '${block.blockId}' failed to render and was skipped: ${error.message}`
    );
    return null;
  }
};

export const Html = { toReport };

/** DangerousHtml renders through the same engine, from the same property. */
export const DangerousHtml = Html;
