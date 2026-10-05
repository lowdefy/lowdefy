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

import { journeyTargetSelectors, type } from '@lowdefy/helpers';

import computeShape from './computeShape.js';
import isPageReady from '../isPageReady.js';
import listCandidates from './listCandidates.js';

// A control that opens a dropdown: a native select, an ARIA combobox, or any
// control inside an antd Select or Cascader. A `select` step drives it.
const POPUP_TRIGGER = 'select, [role="combobox"]';
const POPUP_CONTAINER = '.ant-select, .ant-cascader';
const MAX_OPTIONS = 20;
// Values no v7 verb types: a date picker or an object editor.
const UNDRIVEN_VALUE_TYPES = ['date', 'object'];
const FILL_VALUE_TYPES = ['string', 'number'];

// A journey grammar target from an engine description, with the unknown
// parts left out.
function toTarget(description) {
  const target = { blockId: description.block_id };
  [
    ['row', 'row'],
    ['column', 'column'],
    ['text', 'text'],
    ['nth', 'nth'],
  ].forEach(([from, to]) => {
    if (!type.isNone(description[from])) target[to] = description[from];
  });
  if (type.isNone(target.blockId)) delete target.blockId;
  return target;
}

function classify(control) {
  const valueType = control.block?.valueType ?? null;
  if ((control.textInput || control.popup) && UNDRIVEN_VALUE_TYPES.includes(valueType)) {
    return 'undriven';
  }
  if (control.popup) return 'select';
  if (control.textInput && FILL_VALUE_TYPES.includes(valueType)) return 'fill';
  return 'click';
}

function reachedConnections({ blockIds, externalBlocks }) {
  return [...new Set(blockIds.flatMap((blockId) => externalBlocks[blockId] ?? []))].sort();
}

// What a walk sees after settling: the page, whether it is ready, its state
// shape, and the interactions it may take, each ready to send back as a
// grammar step (click: target, or fill / select with a value the policy
// picks). Left out, and counted: date and object inputs, links that leave the
// app or open a new tab, controls whose block reaches a connection the data
// set does not redirect (unless allowExternal names every one), controls
// whose block runs an auth-engine action, and on a snapshot data set grid
// rows that show no known text.
//
// walk: { pageId, externalBlocks: { [blockId]: [connectionId] },
// authActionBlocks: [blockId], allowExternal: [connectionId], knownText
// (collectKnownText's result), snapshot (the data set has a snapshot) }.
// open: true on the walk's first observation, which reports redirected.
async function observeWalk({ page, walk, open = false }) {
  const listed = await page.evaluate(listCandidates, {
    interactiveControl: journeyTargetSelectors.interactiveControl,
    layers: journeyTargetSelectors.layers,
    popupTrigger: POPUP_TRIGGER,
    popupContainer: POPUP_CONTAINER,
    maxOptions: MAX_OPTIONS,
  });
  const allowExternal = new Set(walk.allowExternal ?? []);
  const authActionBlocks = new Set(walk.authActionBlocks ?? []);
  const externalBlocks = walk.externalBlocks ?? {};
  const excluded = {
    dateOrObjectInput: 0,
    externalLink: 0,
    externalConnection: [],
    authAction: 0,
    snapshotRow: 0,
  };
  const candidates = [];
  const seen = new Set();
  listed.controls.forEach((control) => {
    const { description } = control;
    const blockIds = description.block_ids ?? [];
    if (control.link !== null && (control.link.offOrigin || control.link.newTab)) {
      excluded.externalLink += 1;
      return;
    }
    const kind = classify(control);
    if (kind === 'undriven') {
      excluded.dateOrObjectInput += 1;
      return;
    }
    const connections = reachedConnections({ blockIds, externalBlocks });
    if (connections.some((connectionId) => !allowExternal.has(connectionId))) {
      if (!excluded.externalConnection.includes(description.block_id)) {
        excluded.externalConnection.push(description.block_id);
      }
      return;
    }
    if (blockIds.some((blockId) => authActionBlocks.has(blockId))) {
      excluded.authAction += 1;
      return;
    }
    let rowText = null;
    if (!type.isNone(description.row)) {
      rowText = walk.knownText?.findIn(control.rowText) ?? null;
      if (walk.snapshot === true && rowText === null) {
        excluded.snapshotRow += 1;
        return;
      }
    }
    const target = toTarget(description);
    const key = JSON.stringify([kind, target]);
    if (seen.has(key)) return;
    seen.add(key);
    const candidate = {
      id: `c${candidates.length}`,
      kind,
      target,
      blockType: description.block_type ?? control.block?.type ?? null,
      blockIds,
      label: control.block?.label ?? control.text,
    };
    if (kind === 'fill') {
      const { valueType, required, maxLength, min, max, hasValidate } = control.block;
      candidate.input = { valueType, required, maxLength, min, max, hasValidate };
    }
    if (kind === 'select') {
      candidate.options = control.block?.options ?? [];
    }
    if (rowText !== null) {
      candidate.rowText = rowText;
    }
    candidates.push(candidate);
  });

  const observation = {
    pageId: listed.pageId,
    pathParams: listed.pathParams,
    url: listed.url,
    ready: await page.evaluate(isPageReady),
    shape: computeShape({
      pageId: listed.pageId,
      layers: listed.layers,
      candidates,
      stateShape: listed.stateShape,
      knownText: walk.knownText,
    }),
    candidates,
    excluded,
  };
  if (open) {
    observation.redirected = listed.pageId !== walk.pageId;
  }
  return observation;
}

export default observeWalk;
