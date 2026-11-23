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

import BLOCK_STAND_INS from './BLOCK_STAND_INS.js';
import collectBlockParents from './collectBlockParents.js';
import { collectRenderedBlocks } from './collectMountOrder.js';
import isBlockShown from './isBlockShown.js';
import readNodeText from './readNodeText.js';
import readShownBlock from './readShownBlock.js';
import readStandInState from './readStandInState.js';
import describeBlock from './standIns/describeBlock.js';
import isInsideBlock from './standIns/isInsideBlock.js';
import { normalize } from './standIns/matchHtmlText.js';

// The button labels antd's en_US locale gives a Modal's and a ConfirmModal's footer, which no
// property holds.
const POPUP_DEFAULT_TEXT = { ConfirmModal: ['OK', 'Cancel'], Modal: ['OK', 'Cancel'] };
// Blocks antd draws as a menu ([role="menu"]), the first layer a browser looks in for a `text`
// target with no blockId: a Menu while shown, a dropdown while its stand-in holds it open.
const DROPDOWN_MENU_TYPES = new Set(['DropdownButton', 'DropdownMenu']);

function collectStrings(value, strings = []) {
  if (type.isString(value)) {
    strings.push(value);
  } else if (type.isArray(value)) {
    value.forEach((item) => collectStrings(item, strings));
  } else if (type.isObject(value)) {
    Object.values(value).forEach((item) => collectStrings(item, strings));
  }
  return strings;
}

// The text a block other than a ClickableHtml may show, as far as the engine knows it: every
// string in its evaluated properties (an html string read as the text it shows), the app menu a
// menu block draws when it has no links of its own, and the labels antd gives a popup's buttons.
// A headless page draws no component, so this over-reads (a style or a url counts) and stays on
// the safe side.
function readBlockStrings({ block, lowdefy, parse }) {
  const properties = block.eval?.properties ?? {};
  const strings = collectStrings(properties);
  if (/Menu/.test(block.type) && !type.isArray(properties.links)) {
    collectStrings(lowdefy.menus ?? [], strings);
  }
  strings.push(...(POPUP_DEFAULT_TEXT[block.type] ?? []));
  return strings.map((value) => (/[<&]/.test(value) ? readNodeText(parse(value)) : value));
}

// The first of `blocks` that may show the target's text, or null. Text a `text` target names
// exactly is looked for as a part of the block's text too, which over-reads on the safe side.
function findShowingBlock({ blocks, lowdefy, parse, target }) {
  const needle = normalize(String(target.text ?? target.containing));
  return (
    blocks.find((block) =>
      readBlockStrings({ block, lowdefy, parse }).some((text) => normalize(text).includes(needle))
    ) ?? null
  );
}

function isMenuLayer({ actor, block }) {
  if (/Menu/.test(block.type) && !DROPDOWN_MENU_TYPES.has(block.type)) {
    return true;
  }
  return (
    DROPDOWN_MENU_TYPES.has(block.type) && actor.page.standIns.get(block.id)?.state.open === true
  );
}

// What a `text` or `containing` target names on the actor's page, read from the ClickableHtml
// blocks it shows (LDF-1146), as the browser runner looks (runJourneySteps' locateMatches): in the
// block a blockId names and the blocks inside it, else on the whole page, where antd also draws
// a ClickableHtml's open popover and confirm. A `text` target with no blockId is looked for in
// the front-most open layer first, a menu and then a Modal or Drawer, and on the page when that
// layer holds none. Returns, synchronously so a check can poll it:
// - matches: what the browser would choose from, in page order (listHtmlTextMatches');
// - other: a block that may show the text too, which a headless run cannot read (findShowingBlock),
//   or null;
// - uncertain: why the html alone cannot tell what matches, or null;
// - layer: why the layer a browser looks in first cannot be known, or null;
// - behind(match): whether the match sits behind the newest open popup's mask, which takes a
//   browser's click;
// - scopeShown: false when the blockId names no block the page shows.
// parse is loadHtmlDom's.
function readTextTarget({ actor, parse, target }) {
  const { page } = actor;
  const { context } = page;
  const lowdefy = context._internal.lowdefy;
  const { blocks, parents } = collectBlockParents({ context });
  const rendered = new Set(
    collectRenderedBlocks({
      mountFinished: page.mountFinished,
      openBlocks: page.openBlocks,
      slots: context._internal.RootSlots,
    })
  );
  const shown = blocks.filter((block) => isBlockShown({ block, page, parents, rendered }));
  const pageWide = type.isUndefined(target.blockId);
  const scope = pageWide ? null : readShownBlock({ actor, blockId: target.blockId });
  const reading = { matches: [], other: null, uncertain: null, layer: null, behind: () => false };
  if (!pageWide && scope === null) {
    return { ...reading, scopeShown: false };
  }
  const inScope = (block) =>
    pageWide || block === scope || isInsideBlock({ block, container: scope, parents });
  const scoped = shown.filter(inScope);
  const others = scoped.filter((block) => block.type !== 'ClickableHtml');
  const listed = scoped
    .filter((block) => block.type === 'ClickableHtml')
    .map((block) =>
      BLOCK_STAND_INS.ClickableHtml.textMatches({
        block,
        i18n: lowdefy.i18n,
        overlays: pageWide,
        parse,
        state: readStandInState({ actor, block }),
        target,
      })
    );
  const all = listed.flatMap(({ matches }) => matches);
  const uncertain = listed.find((item) => item.uncertain !== null)?.uncertain ?? null;
  const byId = new Map(blocks.map((block) => [block.id, block]));
  const popups = [...page.openBlocks]
    .map((id) => byId.get(id))
    .filter((block) => shown.includes(block));
  const top = popups.at(-1);
  const inTop = (block) =>
    !type.isUndefined(top) && (block === top || isInsideBlock({ block, container: top, parents }));
  const behind = (match) => !type.isUndefined(top) && !inTop(match.block);
  const read = { ...reading, scopeShown: true, uncertain, behind };
  const find = (candidates) => findShowingBlock({ blocks: candidates, lowdefy, parse, target });
  if (!pageWide || !type.isUndefined(target.containing)) {
    return { ...read, matches: all, other: find(others) };
  }
  if (popups.length > 1) {
    return {
      ...read,
      layer: `${popups.length} popups are open, and a browser looks for the text in the one it drew last`,
    };
  }
  const menu = find(others.filter((block) => isMenuLayer({ actor, block })));
  if (menu !== null) {
    return {
      ...read,
      layer: `${describeBlock(menu)} may show the text in its menu, where a browser looks first`,
    };
  }
  if (type.isUndefined(top)) {
    return { ...read, matches: all, other: find(others) };
  }
  const inside = all.filter((match) => inTop(match.block) && match.where === 'html');
  const insideOther = find(others.filter(inTop));
  if (inside.length > 0) {
    return { ...read, matches: inside, other: insideOther };
  }
  if (insideOther !== null) {
    return {
      ...read,
      layer: `${describeBlock(insideOther)} may show the text in ${describeBlock(
        top
      )}, where a browser looks first`,
    };
  }
  return { ...read, matches: all, other: find(others) };
}

export default readTextTarget;
