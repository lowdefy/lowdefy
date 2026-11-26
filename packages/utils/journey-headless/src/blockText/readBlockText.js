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

import collectBlockParents from '../collectBlockParents.js';
import { collectRenderedBlocks } from '../collectMountOrder.js';
import isBlockShown from '../isBlockShown.js';
import POPUP_BLOCK_TYPES from '../POPUP_BLOCK_TYPES.js';
import describeBlock from '../standIns/describeBlock.js';
import collectClassTokens from './collectClassTokens.js';
import isLayoutHidden from './isLayoutHidden.js';
import isStyledStyle from './isStyledStyle.js';
import mayHideBlock from './mayHideBlock.js';
import markdownToHtml from './markdownToHtml.js';
import normalizeShownText from './normalizeShownText.js';
import { mayApplyClass } from './readClassToken.js';
import readHtmlPieces from './readHtmlPieces.js';
import setsTailwindBreakpoints from './setsTailwindBreakpoints.js';
import readTextModel from './readTextModel.js';

// The block a blockId names and the Slots that hold it, walking the page as the web client
// renders it, or null.
function findBlock({ blockId, slots }) {
  for (const slot of Object.values(slots.slots)) {
    for (const block of slot.blocks) {
      if (block.blockId === blockId) return { block, slots };
      for (const subSlots of slots.subSlots[block.id] ?? []) {
        const found = findBlock({ blockId, slots: subSlots });
        if (found !== null) return found;
      }
    }
  }
  return null;
}

// The runs and units of one piece of a block's text (BLOCK_TEXT_MODELS' pieces), with a cache of
// parsed html by string, since a check reads the page every 50 ms.
function readPiece({ cache, customBreakpoints, parse, piece }) {
  if (!type.isUndefined(piece.text)) {
    return {
      runs: piece.unsure ? [] : [{ text: piece.text, pre: piece.pre === true }],
      classHidden: [],
      units: [normalizeShownText(piece.text)],
      open: null,
    };
  }
  if (!type.isUndefined(piece.either)) {
    const asHtml = readPiece({
      cache,
      customBreakpoints,
      parse,
      piece: { html: piece.either, unsure: true },
    });
    return {
      runs: [],
      classHidden: [],
      units: [...asHtml.units, normalizeShownText(piece.either)],
      open: asHtml.open,
    };
  }
  let { html } = piece;
  let open = null;
  if (!type.isUndefined(piece.markdown)) {
    ({ html, open } = markdownToHtml({
      markdown: piece.sanitize === true ? parse.sanitize(piece.markdown) : piece.markdown,
      raw: piece.raw === true,
      skipHtml: piece.skipHtml === true,
    }));
  }
  const pre = piece.pre === true;
  const flexRoot = piece.flexRoot === true;
  const key = `${pre}:${flexRoot}:${customBreakpoints}:${html}`;
  if (!cache.has(key)) {
    cache.set(key, readHtmlPieces({ root: parse(html), pre, flexRoot, customBreakpoints }));
  }
  const read = cache.get(key);
  return {
    runs: piece.unsure ? [] : read.runs,
    classHidden: piece.unsure ? [] : read.classHidden,
    units: read.units,
    open: read.open ?? open,
  };
}

// Classes and styles on a block that change how its text reads: a case transform, kept white space
// or a class that may hide it (Tailwind's, as readHtmlPieces reads them in html).
// A class counts when it may apply at the browser runner's width (readClassToken).
const STYLED_CLASS =
  /^(uppercase|lowercase|capitalize|hidden|invisible|collapse|whitespace-(pre|pre-line|pre-wrap|break-spaces)|\[(display|visibility|text-transform|white-space):.+\])$/;
// Whether a block's own `style` or `class`, a style of one of its slots (Container hands it to
// the slot's Area), or a layout that hides it at the runner's width (a span of 0) may change how
// the text inside it reads, so its runs may not show as written.
function isStyled({ block, customBreakpoints }) {
  return (
    isStyledStyle({ style: block.eval?.style }) ||
    Object.values(block.eval?.slots ?? {}).some((slot) => isStyledStyle({ style: slot?.style })) ||
    mayApplyClass({
      tokens: collectClassTokens(block.eval?.class),
      pattern: STYLED_CLASS,
      customBreakpoints,
    }) ||
    isLayoutHidden({ layout: block.eval?.layout })
  );
}

// The blocks holding a block, nearest first.
function listAncestors({ block, parents }) {
  const ancestors = [];
  for (let parent = parents.get(block.id); !type.isNone(parent); parent = parents.get(parent.id)) {
    ancestors.push(parent);
  }
  return ancestors;
}

// The closed Modal or Drawer, the block itself or one holding it, whose content antd keeps in the
// page hidden: forceRender draws it before it opens, and once opened it stays after it closes,
// unless destroyOnHidden. A browser's check then reads that hidden text. Null when there is none.
function findHiddenPopup({ block, ancestors, page }) {
  return (
    [block, ...ancestors].find(
      (candidate) =>
        POPUP_BLOCK_TYPES.has(candidate.type) &&
        !page.openBlocks.has(candidate.id) &&
        candidate.eval?.properties?.destroyOnHidden !== true &&
        (candidate.eval?.properties?.forceRender === true || page.openedBlocks.has(candidate.id))
    ) ?? null
  );
}

// The text a browser's text check reads in a block: its own text and the text of the
// blocks inside it a browser draws, each from its text model (readTextModel). The browser runner
// reads the block's innerText and, for a Modal or Drawer, its portal's: a block inside another
// Modal or Drawer is drawn in that one's portal, so it is not in the text. A block is drawn when
// isBlockShown says so and every block holding it, up to the checked one, draws the area it sits
// in. A block whose own style or class (or a holding block's) may change how its text reads
// (isStyled: a slot's style and a layout that hides it at 1280px among them) adds no runs. A
// checked block that may not be rendered, or that one holding it may not (mayHideBlock), leaves
// the text open, as the browser reads its textContent. A block not shown because a closed Modal
// or Drawer holds it leaves the text open when antd keeps that popup's content in the page
// (findHiddenPopup). An app that sets its own Tailwind breakpoints (setsTailwindBreakpoints) has
// its named breakpoint classes read as ones that may apply. Returns { onPage, shown, runs,
// classHidden, styled, units, unmodeled, open, text }:
// - onPage: whether the web client renders the block, so its wrapper is in the page;
// - shown: whether it is shown, so its text is drawn;
// - runs, classHidden and units: readHtmlPieces', over every piece;
// - styled: the blocks whose style or class keeps their text out of the runs (isStyled);
// - unmodeled: the drawn blocks with no text model, whose text the run cannot read;
// - open: why some of the text is not known, each naming its block;
// - text: the runs joined with breaks, for a failure's message.
// parse is loadHtmlDom's; cache holds the html read so far, by string.
function readBlockText({ actor, blockId, cache, parse }) {
  const { page } = actor;
  const { context } = page;
  const { lowdefy } = context._internal;
  const { blockMetas } = lowdefy._internal;
  const customBreakpoints = setsTailwindBreakpoints({ tailwind: lowdefy.theme?.tailwind });
  const reading = {
    onPage: false,
    shown: false,
    runs: [],
    classHidden: [],
    styled: [],
    units: [],
    unmodeled: [],
    open: [],
    text: '',
  };
  const found = findBlock({ blockId, slots: context._internal.RootSlots });
  if (found === null) return reading;
  const { parents } = collectBlockParents({ context });
  const rendered = new Set(
    collectRenderedBlocks({
      mountFinished: page.mountFinished,
      openBlocks: page.openBlocks,
      slots: context._internal.RootSlots,
    })
  );
  // The browser finds the block's wrapper only while the web client renders it.
  reading.onPage = rendered.has(found.block);
  const isShown = (block) => isBlockShown({ block, page, parents, rendered });
  const ancestorsOf = (block) => listAncestors({ block, parents });
  if (!isShown(found.block)) {
    const popup = findHiddenPopup({
      block: found.block,
      ancestors: ancestorsOf(found.block),
      page,
    });
    if (popup !== null) {
      reading.open.push(
        `${describeBlock(popup)}: it is closed, and antd keeps its content in the page hidden, which a browser's check reads`
      );
    }
    return reading;
  }
  reading.shown = true;
  // The browser reads the textContent of a block that is not rendered, every text node in it,
  // which a headless reading does not follow: a check it does not find is open, not missing.
  [found.block, ...ancestorsOf(found.block)]
    .filter((block) => mayHideBlock({ block, customBreakpoints }))
    .forEach((block) => {
      reading.open.push(
        `${describeBlock(block)}: it may not be rendered (display: none), and a browser's check then reads every text node in it`
      );
    });
  const styledAncestor = ancestorsOf(found.block).find((block) =>
    isStyled({ block, customBreakpoints })
  );
  if (!type.isUndefined(styledAncestor)) reading.styled.push(styledAncestor);
  function visit({ block, slots, styled }) {
    const model = readTextModel({ block, blockMetas });
    if (model === null) {
      reading.unmodeled.push(block);
      return;
    }
    const subSlotsList = slots.subSlots[block.id] ?? [];
    // The web client hands a component an area only when its slot holds blocks (Container).
    const areaNames = new Set(
      subSlotsList.flatMap((subSlots) =>
        Object.keys(subSlots.slots).filter((area) => subSlots.slots[area].blocks.length > 0)
      )
    );
    const { pieces, areas, open } = model({
      ancestors: ancestorsOf(block),
      areaNames,
      block,
      customBreakpoints,
      i18n: actor.i18n,
      properties: block.eval?.properties ?? {},
    });
    const ownStyle = !styled && isStyled({ block, customBreakpoints });
    if (ownStyle) reading.styled.push(block);
    const blockStyled = styled || ownStyle;
    if (open !== null) reading.open.push(`${describeBlock(block)}: ${open}`);
    pieces.forEach((piece) => {
      const read = readPiece({
        cache,
        customBreakpoints,
        parse,
        piece: blockStyled ? { ...piece, unsure: true } : piece,
      });
      reading.runs.push(...read.runs);
      reading.classHidden.push(...read.classHidden);
      reading.units.push(...read.units);
      if (read.open !== null) reading.open.push(`${describeBlock(block)}: ${read.open}`);
    });
    subSlotsList.forEach((subSlots) => {
      Object.entries(subSlots.slots).forEach(([area, slot]) => {
        slot.blocks.forEach((child) => {
          if (!isShown(child)) return;
          // A Modal or Drawer draws in a portal, outside the block, unless a Drawer's getContainer
          // places it elsewhere, which may be inside.
          if (POPUP_BLOCK_TYPES.has(child.type)) {
            if (!type.isNone(child.eval?.properties?.getContainer)) {
              reading.open.push(
                `${describeBlock(child)}: its getContainer may draw it inside the block`
              );
            }
            return;
          }
          if (areas === null) {
            reading.open.push(
              `${describeBlock(block)}: it draws the blocks inside it, which its headlessText does not cover`
            );
            return;
          }
          if (areas.includes(area)) visit({ block: child, slots: subSlots, styled: blockStyled });
        });
      });
    });
  }
  visit({ ...found, styled: reading.styled.length > 0 });
  reading.open = [...new Set(reading.open)];
  reading.text = reading.runs
    .map((run) => (run.pre ? run.text : run.text.replace(/[ \t\n\r\f]+/g, ' ').trim()))
    .filter((text) => text !== '')
    .join('\n');
  return reading;
}

export default readBlockText;
