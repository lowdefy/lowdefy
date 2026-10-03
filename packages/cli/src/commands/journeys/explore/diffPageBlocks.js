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

import { resolveConfigLocation } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

import normaliseArtifact from './normaliseArtifact.js';

const CONTAINER_KEYS = ['slots', 'areas'];

function asArray(value) {
  if (type.isArray(value)) return value;
  if (type.isArray(value?.['~arr'])) return value['~arr'];
  return [];
}

function childBlocks(block) {
  return CONTAINER_KEYS.flatMap((key) =>
    Object.values(block[key] ?? {}).flatMap((container) => asArray(container?.blocks))
  );
}

// The block's own config: its child blocks are compared as blocks of their
// own, and typesKey (on the page root) changes with any block type on the page.
function ownConfig(block) {
  const own = { ...block };
  delete own.typesKey;
  CONTAINER_KEYS.forEach((key) => {
    if (!type.isObject(block[key])) return;
    own[key] = Object.fromEntries(
      Object.entries(block[key]).map(([name, container]) => {
        if (!type.isObject(container)) return [name, container];
        const { blocks, ...rest } = container;
        return [name, rest];
      })
    );
  });
  return JSON.stringify(normaliseArtifact(own));
}

function blockLabel(block) {
  const candidates = [block.properties?.title, block.label?.title, block.properties?.label];
  return candidates.find((candidate) => type.isString(candidate)) ?? null;
}

function indexBlocks(page) {
  const blocks = new Map();
  function visit(block) {
    if (!type.isObject(block) || !type.isString(block.blockId)) return;
    blocks.set(block.blockId, block);
    childBlocks(block).forEach(visit);
  }
  if (!type.isNone(page)) visit(page);
  return blocks;
}

// Each block of a page that a PR added, changed or removed, matched by
// blockId through slots and areas. A block is changed when its own config,
// without its child blocks, differs after normalising. source is the head
// block's file and line, through the head build's keyMap and refMap.
function diffPageBlocks({ basePage, headPage, keyMap, refMap }) {
  const base = indexBlocks(basePage);
  const head = indexBlocks(headPage);
  const changes = [];
  head.forEach((block, blockId) => {
    let change = null;
    if (!base.has(blockId)) {
      change = 'added';
    } else if (ownConfig(base.get(blockId)) !== ownConfig(block)) {
      change = 'changed';
    }
    if (change === null) return;
    changes.push({
      blockId,
      type: block.type ?? null,
      change,
      label: blockLabel(block),
      source: resolveConfigLocation({ configKey: block['~k'], keyMap, refMap })?.source ?? null,
    });
  });
  base.forEach((block, blockId) => {
    if (head.has(blockId)) return;
    changes.push({
      blockId,
      type: block.type ?? null,
      change: 'removed',
      label: blockLabel(block),
      source: null,
    });
  });
  return changes;
}

export default diffPageBlocks;
