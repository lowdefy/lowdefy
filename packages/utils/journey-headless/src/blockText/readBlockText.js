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
import markdownToHtml from './markdownToHtml.js';
import normalizeShownText from './normalizeShownText.js';
import readHtmlPieces from './readHtmlPieces.js';
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
function readPiece({ cache, parse, piece }) {
  if (!type.isUndefined(piece.text)) {
    return {
      runs: piece.unsure ? [] : [{ text: piece.text, pre: piece.pre === true }],
      units: [normalizeShownText(piece.text)],
      open: null,
    };
  }
  if (!type.isUndefined(piece.either)) {
    const asHtml = readPiece({ cache, parse, piece: { html: piece.either, unsure: true } });
    return {
      runs: [],
      units: [...asHtml.units, normalizeShownText(piece.either)],
      open: asHtml.open,
    };
  }
  let { html } = piece;
  let open = null;
  if (!type.isUndefined(piece.markdown)) {
    ({ html, open } = markdownToHtml({
      markdown: piece.markdown,
      raw: piece.raw === true,
      skipHtml: piece.skipHtml === true,
    }));
  }
  const key = `${piece.pre === true}:${html}`;
  if (!cache.has(key)) {
    cache.set(key, readHtmlPieces({ root: parse(html), pre: piece.pre === true }));
  }
  const read = cache.get(key);
  return { runs: piece.unsure ? [] : read.runs, units: read.units, open: read.open ?? open };
}

// The text a browser's text check reads in a block (LDF-1147): its own text and the text of the
// blocks inside it a browser draws, each from its text model (readTextModel). The browser runner
// reads the block's innerText and, for a Modal or Drawer, its portal's: a block inside another
// Modal or Drawer is drawn in that one's portal, so it is not in the text. A block is drawn when
// isBlockShown says so and every block holding it, up to the checked one, draws the area it sits
// in. Returns { shown, runs, units, unmodeled, open, text }:
// - shown: whether the block is on the page and shown;
// - runs and units: readHtmlPieces', over every piece;
// - unmodeled: the drawn blocks with no text model, whose text the run cannot read;
// - open: why some of the text is not known, each naming its block;
// - text: the runs joined with breaks, for a failure's message.
// parse is loadHtmlDom's; cache holds the html read so far, by string.
function readBlockText({ actor, blockId, cache, parse }) {
  const { page } = actor;
  const { context } = page;
  const { blockMetas } = context._internal.lowdefy._internal;
  const reading = { shown: false, runs: [], units: [], unmodeled: [], open: [], text: '' };
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
  const isShown = (block) => isBlockShown({ block, page, parents, rendered });
  if (!isShown(found.block)) return reading;
  reading.shown = true;
  function visit({ block, slots }) {
    const model = readTextModel({ block, blockMetas });
    if (model === null) {
      reading.unmodeled.push(block);
      return;
    }
    const subSlotsList = slots.subSlots[block.id] ?? [];
    const areaNames = new Set(subSlotsList.flatMap((subSlots) => Object.keys(subSlots.slots)));
    const { pieces, areas, open } = model({
      areaNames,
      block,
      i18n: actor.i18n,
      properties: block.eval?.properties ?? {},
    });
    if (open !== null) reading.open.push(`${describeBlock(block)}: ${open}`);
    pieces.forEach((piece) => {
      const read = readPiece({ cache, parse, piece });
      reading.runs.push(...read.runs);
      reading.units.push(...read.units);
      if (read.open !== null) reading.open.push(`${describeBlock(block)}: ${read.open}`);
    });
    subSlotsList.forEach((subSlots) => {
      Object.entries(subSlots.slots).forEach(([area, slot]) => {
        slot.blocks.forEach((child) => {
          if (!isShown(child) || POPUP_BLOCK_TYPES.has(child.type)) return;
          if (areas === null) {
            reading.open.push(
              `${describeBlock(block)}: it draws the blocks inside it, which its headlessText does not cover`
            );
            return;
          }
          if (areas.includes(area)) visit({ block: child, slots: subSlots });
        });
      });
    });
  }
  visit(found);
  reading.open = [...new Set(reading.open)];
  reading.text = reading.runs
    .map((run) => (run.pre ? run.text : run.text.replace(/[ \t\n\r\f]+/g, ' ').trim()))
    .filter((text) => text !== '')
    .join('\n');
  return reading;
}

export default readBlockText;
