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
 * Walk an evaluated block tree (from `evaluatePage`) into the report IR.
 *
 * The walker is the single place the renderer registry contract lives. Every
 * block `./static` renderer exposes:
 *
 *   { toReport: ({ block, areas, items, layout, context }) => IRNode | IRNode[] | null }
 *
 * A renderer may return a promise of that — the walker awaits every result, so
 * a renderer backed by a promise-only engine costs a sync renderer nothing.
 * Siblings render in order rather than concurrently: a report holds tens of
 * blocks, not thousands, and serial rendering keeps warnings ordered.
 *
 *   - `block` is a plain projection ({ id, blockId, type, properties, value,
 *     style, layout }); `block.properties` is the resolved `propertiesEval.output`.
 *   - `areas` (containers) maps each area name to its already-walked IR nodes,
 *     each area laid out as its own sibling list, so a Tabs renderer reads its
 *     panels by key and a Card keeps its title apart from its content.
 *   - `items` (lists) is one such areas object per list item.
 *   - `layout` is the resolved column geometry `{ width, fraction }`, `width` in
 *     points, so charts and Html size to the column they will be drawn in.
 *   - `context` is the render context `{ logger, icons, renderHtml, contentWidth,
 *     signal }` passed straight through.
 *
 * Row grouping and the width each cell receives live in `walk/walkSiblings.js`
 * and `walk/flushRow.js`.
 */

import { type } from '@lowdefy/helpers';

import { DEFAULT_CONTENT_WIDTH } from './geometry.js';
import createWalkState from './walk/createWalkState.js';
import walkAreas from './walk/walkAreas.js';

/**
 * @param {object} evaluatedContext - the engine context from `evaluatePage`.
 * @param {object} registry - block type → `{ toReport }` static renderer.
 * @param {object} reportOptions - per-block `report:` config keyed by blockId
 *   (`{ [blockId]: { exclude?, pageBreakBefore?, sheetName? } }`). List items
 *   fall back to the un-indexed blockId pattern.
 * @param {object} context - render context passed to every renderer.
 * @returns {Promise<{ nodes: IRNode[], warnings: Array<{ blockType, blockIds }>,
 *   renderErrors: Array<{ blockType, blockIds, message }> }>}
 */
async function walkBlocks(evaluatedContext, registry = {}, reportOptions = {}, context = {}) {
  const walk = createWalkState({ registry, reportOptions, context });
  const contentWidth = type.isNumber(context.contentWidth)
    ? context.contentWidth
    : DEFAULT_CONTENT_WIDTH;

  // The page block is the document, not a rendered node — walk its areas and
  // lay them out one after the other.
  const root = evaluatedContext?._internal?.RootSlots?.slots?.root?.blocks?.[0];
  let nodes = [];
  if (root) {
    const areas = await walkAreas({
      subSlot: root.subSlots?.[0],
      availableWidth: contentWidth,
      walk,
    });
    nodes = Object.values(areas).flat();
  }

  return { nodes, ...walk.summary() };
}

export default walkBlocks;
