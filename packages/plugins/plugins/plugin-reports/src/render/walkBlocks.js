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
 *   { toReport: ({ block, children, layout, context }) => IRNode | IRNode[] | null }
 *
 * A renderer may return a promise of that — the walker awaits every result. Not
 * every rendering engine offers a synchronous entry point (takumi, which lays
 * out Html blocks, is promise-only), and one awaited contract costs a sync
 * renderer nothing while keeping async rendering out of every other renderer's
 * business. Siblings render in order rather than concurrently: a report holds
 * tens of blocks, not thousands, and serial rendering keeps warnings ordered.
 *
 * where `block` is a plain projection ({ id, blockId, type, properties, value,
 * style, layout }) — `block.properties` is the fully resolved
 * `propertiesEval.output`; `children` is the already-walked child IR node array
 * for container/list blocks (undefined for leaves); `layout` carries the
 * resolved column geometry `{ width, fraction }` (`width` in points, from
 * fraction × content width) so charts and Html size correctly; `context` is the
 * render context `{ logger, theme, i18n, fonts, stylesheets, contentWidth }`
 * passed straight through.
 *
 * Layout is the design's simplified grid: blocks appear in source order;
 * consecutive siblings whose numeric `layout.span` values sum to ≤ 24 form one
 * `row` node with `span/24` width fractions; a missing (or ≥ 24) span is full
 * width and ends any open row; `offset` becomes a leading `spacer` child.
 * `order`, `push`, `pull` and responsive overrides are ignored with a debug log.
 *
 * Flex sizing is honoured, because ignoring it split the commonest tile pattern
 * across two lines. In the Lowdefy grid a block carrying any of `flex`, `grow`,
 * `shrink` or `size` is a plain flex child — sized by its content and sitting
 * inline with its siblings — while a block with no layout at all is full width
 * (`deriveLayout.js`: those four keys short-circuit the span classes). So an
 * icon and its label, both `flex: 0 1 auto`, belong on one line. Such siblings
 * join the row with a content width (`auto`), or `fill` when they grow. A row is
 * one mode or the other — a run of siblings that switches between spans and flex
 * breaks into a row per mode, since a fraction and a content width cannot share
 * one width budget.
 */

import { type } from '@lowdefy/helpers';

import { row, spacer, stack, validateNode } from '../ir/nodes.js';

/** Grid width, in antd-style columns. A span equal to this is full width. */
const FULL_SPAN = 24;

/**
 * Default content width in points: A4 portrait (595.28pt) minus pdfmake's
 * default 40pt side margins. The caller passes the real geometry via
 * `context.contentWidth`; this keeps renderers sizing sanely without it.
 */
const DEFAULT_CONTENT_WIDTH = 515.28;

const LAYOUT_IGNORED_KEYS = ['order', 'push', 'pull', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'];

// The keys that make a block a flex child rather than a grid column, mirroring
// deriveFlex in @lowdefy/layout.
const FLEX_KEYS = ['flex', 'grow', 'shrink', 'size'];

const isFlexChild = (layout) => FLEX_KEYS.some((key) => !type.isNone(layout[key]));

/**
 * Does this flex child take the row's spare width? `flex` shorthand leads with
 * grow (`1 0 auto`, or `true` for `0 1 auto`), and `grow` sets it directly.
 */
const flexGrows = (layout) => {
  if (type.isNumber(layout.grow)) return layout.grow > 0;
  if (layout.grow === true) return true;
  if (layout.flex === true) return false; // shorthand for '0 1 auto'
  if (type.isNumber(layout.flex)) return layout.flex > 0;
  if (type.isString(layout.flex)) return Number.parseFloat(layout.flex) > 0;
  return false;
};

/**
 * Walk the evaluated tree into report IR.
 *
 * @param {object} evaluatedContext - the engine context from `evaluatePage`.
 * @param {object} registry - block type → `{ toReport }` static renderer.
 * @param {object} reportOptions - per-block `report:` config keyed by blockId
 *   (`{ [blockId]: { exclude?, pageBreakBefore?, sheetName? } }`). List items
 *   fall back to the un-indexed blockId pattern.
 * @param {object} context - render context passed to every renderer.
 * @returns {Promise<{ nodes: IRNode[], warnings: Array<{ blockType, blockIds }> }>}
 */
async function walkBlocks(evaluatedContext, registry = {}, reportOptions = {}, context = {}) {
  const logger = context.logger;
  const signal = context.signal;
  // Unsupported types are collected once per type, listing every blockId, so a
  // page with ten unrenderable widgets warns ten blockIds under one type.
  const unsupported = new Map();
  // A renderer that throws (or emits malformed IR) degrades to a skipped block
  // rather than failing the whole document — one broken chart must not lose the
  // report. Collected per type like unsupported, with the first error message.
  const failed = new Map();

  const recordUnsupported = (block) => {
    if (!unsupported.has(block.type)) {
      unsupported.set(block.type, new Set());
    }
    unsupported.get(block.type).add(block.blockId);
  };

  const recordFailure = (block, error) => {
    if (!failed.has(block.type)) {
      failed.set(block.type, { blockIds: new Set(), message: error.message });
    }
    failed.get(block.type).blockIds.add(block.blockId);
    logger?.warn?.(
      { blockId: block.blockId, blockType: block.type, err: error },
      `Report renderer for block '${block.blockId}' (${block.type}) threw; block skipped: ${error.message}`
    );
  };

  // Between blocks, bail once the caller has aborted: rendering a page of slow
  // blocks (takumi Html, large charts) is CPU nobody is waiting for after the
  // generation's deadline has passed.
  const throwIfAborted = () => {
    if (signal?.aborted) throw signal.reason ?? new Error('Report generation was aborted.');
  };

  const optionsFor = (block) =>
    reportOptions[block.blockId] ??
    reportOptions[block.blockIdPattern] ??
    reportOptions[block.id] ??
    {};

  const projectBlock = (block) => ({
    id: block.id,
    blockId: block.blockId,
    type: block.type,
    properties: block.propertiesEval?.output ?? {},
    value: block.value,
    style: block.styleEval?.output,
    layout: block.layoutEval?.output ?? {},
  });

  // A container or list holds child blocks; a container has one sub-slot set, a
  // list one per item. Flattening every sub-slot's every slot in order yields
  // the children in source order (item 0's blocks, then item 1's, …).
  const childBlocksOf = (block) => {
    const children = [];
    (block.subSlots ?? []).forEach((slots) => {
      Object.values(slots.slots ?? {}).forEach((slot) => {
        (slot.blocks ?? []).forEach((child) => children.push(child));
      });
    });
    return children;
  };

  const isContainerLike = (block) => {
    const category = block.meta?.category;
    return category === 'container' || category === 'input-container' || category === 'list';
  };

  const logIgnoredLayout = (block, layout) => {
    if (!logger?.debug) return;
    const ignored = LAYOUT_IGNORED_KEYS.filter((key) => !type.isNone(layout[key]));
    if (ignored.length > 0) {
      logger.debug(
        { blockId: block.blockId, ignored },
        `Report layout ignores ${ignored.join(', ')} on block '${block.blockId}'.`
      );
    }
  };

  // Produce the IR node(s) for one block. Containers/lists walk their children
  // first (at the block's own resolved width), then call the renderer with them;
  // a container with no renderer passes its children through transparently so a
  // plain Card never swallows its contents — but still records the warning.
  const renderBlock = async (block, width, fraction) => {
    const layout = { width, fraction };
    const renderer = registry[block.type];
    let children;
    if (isContainerLike(block)) {
      children = await walkList(childBlocksOf(block), width);
    }

    let nodes;
    if (renderer && typeof renderer.toReport === 'function') {
      // A renderer is plugin code operating on user data: a throw here is a
      // renderer bug or a hostile property, never a config error worth failing
      // the whole report for. Isolate it — skip the block, keep the document.
      // validateNode runs inside the try so malformed IR degrades the same way.
      try {
        const result = await renderer.toReport({
          block: projectBlock(block),
          children,
          layout,
          context,
        });
        nodes = result == null ? [] : Array.isArray(result) ? result : [result];
        nodes.forEach((node) => validateNode(node));
      } catch (error) {
        recordFailure(block, error);
        nodes = [];
      }
    } else {
      recordUnsupported(block);
      // A container with no renderer passes its children through transparently
      // so a plain Card never swallows its contents.
      nodes = children ?? [];
    }

    const options = optionsFor(block);
    if (options.pageBreakBefore === true && nodes.length > 0) {
      // Break before the block ⇒ before its first emitted node. Copy so the
      // renderer's returned node object is never mutated in place.
      nodes[0] = { ...nodes[0], pageBreakBefore: true };
    }
    // Name xlsx sheets here — the only place that holds both the report
    // sheetName hint and the source blockId. Renderers emit unnamed grids.
    return nodes.map((node) =>
      node.kind === 'grid' && type.isNone(node.sheetName)
        ? { ...node, sheetName: options.sheetName ?? block.blockId }
        : node
    );
  };

  // Walk a sibling list into IR, grouping row-participating blocks and splicing
  // full-width blocks in transparently. `availableWidth` is the content width
  // this list is laid out within (a cell width when nested inside a row).
  const walkList = async (blocks, availableWidth) => {
    const output = [];
    let cells = [];
    let widths = [];
    let rowSpan = 0;
    // A row holds grid columns or flex children, never both, so a mixed run of
    // siblings breaks into one row per mode. The two size against different
    // things — a span column takes its fraction of the row, a flex child takes
    // its content width — and pdfmake resolves the fractions against the whole
    // row, leaving a content-sized sibling nothing: it collapses to its minimum
    // token width and pushes the row past the page margin.
    let rowMode;

    const flush = () => {
      if (cells.length === 0) return;
      // A lone content-sized child is just a block — no row wrapper needed.
      if (cells.length === 1 && !type.isNumber(widths[0])) {
        output.push(cells[0]);
      } else {
        // Give the last content-sized child the spare width when nothing grows,
        // the way a flex row's last item absorbs the slack. This also bounds the
        // row to the available width instead of letting content run past it.
        const grown = widths.some((width) => width === 'fill' || type.isNumber(width));
        const bounded = grown
          ? widths
          : widths.map((width, index) => (index === widths.length - 1 ? 'fill' : width));
        output.push(row({ children: cells, widths: bounded }));
      }
      cells = [];
      widths = [];
      rowSpan = 0;
      rowMode = undefined;
    };

    for (const block of blocks) {
      throwIfAborted();
      if (block.visibleEval?.output === false) continue; // dynamic hiding
      const options = optionsFor(block);
      if (options.exclude === true) continue; // opt-out
      if (block.meta?.category === 'input') continue; // reports are display documents

      const layout = block.layoutEval?.output ?? {};
      // antd's `span: 0` idiom hides a column; a zero (or negative) span is not
      // full width and has no fraction, so treat it as hidden rather than let a
      // zero-width row reach the IR validator.
      if (type.isNumber(layout.span) && layout.span <= 0) continue;
      logIgnoredLayout(block, layout);

      // A flex child sits inline at its content width, so it joins the open row
      // without consuming grid span. Its render width is unknowable up front —
      // give it the row's remaining width so a chart or Html block inside one
      // still sizes sanely.
      if (isFlexChild(layout)) {
        const nodes = await renderBlock(block, availableWidth, 1);
        if (nodes.length === 0) continue;
        if (rowMode === 'grid') flush();
        cells.push(nodes.length === 1 ? nodes[0] : stack({ children: nodes }));
        widths.push(flexGrows(layout) ? 'fill' : 'auto');
        rowMode = 'flex';
        continue;
      }

      const span = type.isNumber(layout.span) ? layout.span : undefined;
      const offset = type.isNumber(layout.offset) && layout.offset > 0 ? layout.offset : 0;
      const fullWidth = span === undefined || span >= FULL_SPAN;

      if (fullWidth) {
        flush();
        (await renderBlock(block, availableWidth, 1)).forEach((node) => output.push(node));
        continue;
      }

      const fraction = span / FULL_SPAN;
      const nodes = await renderBlock(block, fraction * availableWidth, fraction);
      if (nodes.length === 0) continue; // skipped; reserves no grid space

      if (rowMode === 'flex' || rowSpan + offset + span > FULL_SPAN) flush();
      if (offset > 0) {
        const offsetFraction = offset / FULL_SPAN;
        cells.push(spacer({ width: offsetFraction }));
        widths.push(offsetFraction);
        rowSpan += offset;
      }
      cells.push(nodes.length === 1 ? nodes[0] : stack({ children: nodes }));
      widths.push(fraction);
      rowSpan += span;
      rowMode = 'grid';
    }

    flush();
    return output;
  };

  const root = evaluatedContext?._internal?.RootSlots?.slots?.root?.blocks?.[0];
  const contentWidth = type.isNumber(context.contentWidth)
    ? context.contentWidth
    : DEFAULT_CONTENT_WIDTH;
  // The page block is the document, not a rendered node — walk its children.
  const nodes = root ? await walkList(childBlocksOf(root), contentWidth) : [];

  const warnings = [...unsupported.entries()].map(([blockType, blockIds]) => ({
    blockType,
    blockIds: [...blockIds],
  }));

  const renderErrors = [...failed.entries()].map(([blockType, { blockIds, message }]) => ({
    blockType,
    blockIds: [...blockIds],
    message,
  }));

  return { nodes, warnings, renderErrors };
}

export default walkBlocks;
