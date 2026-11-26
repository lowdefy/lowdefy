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

import mayShowText from './blockText/mayShowText.js';
import normalizeShownText from './blockText/normalizeShownText.js';
import BLOCK_STAND_INS from './BLOCK_STAND_INS.js';
import collectBlockParents from './collectBlockParents.js';
import { collectRenderedBlocks } from './collectMountOrder.js';
import isBlockShown from './isBlockShown.js';
import listBlockAncestors from './listBlockAncestors.js';
import mayBlockShowText from './mayBlockShowText.js';
import POPUP_BLOCK_TYPES from './POPUP_BLOCK_TYPES.js';
import readNodeText from './readNodeText.js';
import readShownBlock from './readShownBlock.js';
import readStandInState from './readStandInState.js';
import describeBlock from './standIns/describeBlock.js';
import isInsideBlock from './standIns/isInsideBlock.js';
import knowsAntdLocale from './standIns/knowsAntdLocale.js';
import { normalize } from './standIns/matchHtmlText.js';

// Blocks antd draws as a menu ([role="menu"]), the first layer a browser looks in for a `text`
// target with no blockId: a menu or a page layout that draws the app menu (Menu,
// PageHeaderMenu, PageSidebarLayout) while shown, a dropdown while its stand-in holds it open.
const DROPDOWN_MENU_TYPES = new Set(['DropdownButton', 'DropdownMenu']);
const APP_MENU_TYPE = /Menu|Layout/;

// The first of `blocks` that may show the target's text (mayBlockShowText), described, or null.
function findShowingBlock({ actor, blocks, cache, parents, parse, target }) {
  const { blockMetas } = actor.page.context._internal.lowdefy._internal;
  const text = String(target.text ?? target.containing);
  const block = blocks.find((candidate) =>
    mayBlockShowText({
      ancestors: listBlockAncestors({ block: candidate, parents }),
      block: candidate,
      blockMetas,
      cache,
      i18n: actor.i18n,
      parse,
      text,
    })
  );
  return type.isUndefined(block) ? null : describeBlock(block);
}

// A message the app displayed (displayMessage) that may show the target's text, described, or
// null. antd draws it over the page for a time a headless run does not keep, so every message the
// actor was shown counts.
function findShowingMessage({ actor, parse, target }) {
  const text = String(target.text ?? target.containing);
  const showing = actor.messages.some(({ content }) => {
    if (!type.isString(content)) {
      return !type.isNone(content);
    }
    const shown = /[<&]/.test(content) ? readNodeText(parse(content)) : content;
    return mayShowText({ contains: text, units: [normalizeShownText(shown)] });
  });
  return showing ? 'a message the app displayed' : null;
}

// Whether `block` is drawn inside the scope a blockId names, as the browser runner looks
// (resolveMatchScope): the scope's wrapper and its own portal. A Modal or Drawer inside the scope,
// and the blocks inside it, draw in that popup's portal, outside both.
function isDrawnInScope({ block, parents, scope }) {
  if (block === scope) {
    return true;
  }
  if (!isInsideBlock({ block, container: scope, parents })) {
    return false;
  }
  for (let current = block; current.id !== scope.id; current = parents.get(current.id)) {
    if (POPUP_BLOCK_TYPES.has(current.type)) {
      return false;
    }
  }
  return true;
}

// A tooltip the block the pointer rests on may be showing: a browser's click hovers the element it
// clicks, which shows its data-tooltip, or the whole text of a data-truncate element, in a popup
// a `containing` target also reads. Returns the block when one of those texts holds the target's,
// else null.
function findPointerTooltip({ actor, parse, target }) {
  const block = readShownBlock({ actor, blockId: actor.page.pointerBlockId });
  if (block === null || block.type !== 'ClickableHtml') {
    return null;
  }
  const html = String(block.eval?.properties?.html ?? '');
  if (!html.includes('data-tooltip') && !html.includes('data-truncate')) {
    return null;
  }
  const root = parse(html);
  const needle = normalize(String(target.containing));
  const texts = [
    ...[...root.querySelectorAll('[data-tooltip]')].map((element) =>
      element.getAttribute('data-tooltip')
    ),
    ...[...root.querySelectorAll('[data-truncate]')].map((element) => element.textContent),
  ];
  return texts.some((text) => normalize(text ?? '').includes(needle)) ? block : null;
}

function isMenuLayer({ actor, block }) {
  if (APP_MENU_TYPE.test(block.type) && !DROPDOWN_MENU_TYPES.has(block.type)) {
    return true;
  }
  return (
    DROPDOWN_MENU_TYPES.has(block.type) && actor.page.standIns.get(block.id)?.state.open === true
  );
}

// What a `text` or `containing` target names on the actor's page, read from the ClickableHtml
// blocks it shows, as the browser runner looks (runJourneySteps' locateMatches): in the
// block a blockId names and the blocks inside it, else on the whole page, where antd also draws
// a ClickableHtml's open popover and confirm. A `text` target with no blockId is looked for in
// the front-most open layer first, a menu and then a Modal or Drawer, and on the page when that
// layer holds none. Returns, synchronously so a check can poll it:
// - matches: what the browser would choose from, in page order (listHtmlTextMatches');
// - other: what else may show the text, which a headless run cannot read, described, or null: a
//   block other than a ClickableHtml (findShowingBlock), or on the page a message the app
//   displayed (findShowingMessage);
// - uncertain: why the html alone cannot tell what matches, or null;
// - layer: why the layer a browser looks in first cannot be known, or null;
// - behind(match): whether the match sits behind the newest open popup's mask, which takes a
//   browser's click;
// - scopeShown: false when the blockId names no block the page shows;
// - htmlBlocks: how many ClickableHtml blocks the scope shows.
// A blockId scope holds the blocks drawn inside it (isDrawnInScope); a Drawer in it whose
// getContainer may draw it inside leaves the layer unknown. parse is loadHtmlDom's; cache holds
// the html other blocks show, by string, across reads.
function readTextTarget({ actor, cache, parse, target }) {
  const { page } = actor;
  const { context } = page;
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
  const reading = {
    matches: [],
    other: null,
    uncertain: null,
    layer: null,
    behind: () => false,
    htmlBlocks: 0,
  };
  if (!pageWide && scope === null) {
    return { ...reading, scopeShown: false };
  }
  const scoped = pageWide
    ? shown
    : shown.filter((block) => isDrawnInScope({ block, parents, scope }));
  const others = scoped.filter((block) => block.type !== 'ClickableHtml');
  const listed = scoped
    .filter((block) => block.type === 'ClickableHtml')
    .map((block) =>
      BLOCK_STAND_INS.ClickableHtml.textMatches({
        block,
        knowsLocale: knowsAntdLocale({
          ancestors: listBlockAncestors({ block, parents }),
          i18n: actor.i18n,
        }),
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
  const read = { ...reading, scopeShown: true, uncertain, behind, htmlBlocks: listed.length };
  const find = (candidates) =>
    findShowingBlock({ actor, blocks: candidates, cache, parents, parse, target });
  // What may show the text on the page, or in the scope, beside the ClickableHtml matches.
  const findOther = () =>
    find(others) ?? (pageWide ? findShowingMessage({ actor, parse, target }) : null);
  const relocated = pageWide
    ? undefined
    : shown.find(
        (block) =>
          block !== scope &&
          POPUP_BLOCK_TYPES.has(block.type) &&
          !type.isNone(block.eval?.properties?.getContainer) &&
          isInsideBlock({ block, container: scope, parents })
      );
  if (!type.isUndefined(relocated)) {
    return {
      ...read,
      layer: `${describeBlock(relocated)} draws where its getContainer places it, which may be inside ${describeBlock(
        scope
      )}`,
    };
  }
  if (pageWide && !type.isUndefined(target.containing)) {
    const tooltip = findPointerTooltip({ actor, parse, target });
    if (tooltip !== null) {
      return {
        ...read,
        layer: `the pointer rests on ${describeBlock(
          tooltip
        )}, whose tooltip a browser may show with the text`,
      };
    }
  }
  if (!pageWide || !type.isUndefined(target.containing)) {
    return { ...read, matches: all, other: findOther() };
  }
  if (listed.some((item) => item.layered)) {
    return {
      ...read,
      layer:
        'a ClickableHtml draws a menu or dialog role, a layer a browser looks in before the page',
    };
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
      layer: `${menu} may show the text in its menu, where a browser looks first`,
    };
  }
  if (type.isUndefined(top)) {
    return { ...read, matches: all, other: findOther() };
  }
  const inside = all.filter((match) => inTop(match.block) && match.where === 'html');
  const insideOther = find(others.filter(inTop));
  if (inside.length > 0) {
    return { ...read, matches: inside, other: insideOther };
  }
  if (insideOther !== null) {
    return {
      ...read,
      layer: `${insideOther} may show the text in ${describeBlock(
        top
      )}, where a browser looks first`,
    };
  }
  return { ...read, matches: all, other: findOther() };
}

export default readTextTarget;
