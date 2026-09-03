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

// Build-time provenance markers. They exist so an error can name the file, line
// and column an object came from; nothing an author writes carries them.
const MARKER_KEYS = ['~k', '~r', '~l', '~c', '~x'];

// Keys the build derives and the author never writes: the prefixed block id
// (`block:<pageId>:<blockId>:<n>`), and the page id which is the root's id.
const DERIVED_BLOCK_KEYS = ['blockId', 'pageId'];

const DEFAULT_SLOT = 'content';

// A built block always carries either a resolved blockId or the slots the build
// moved its areas into, so this recognises exactly the nodes whose shape the
// build changed — a skeleton block (no blockId) included.
function isBuiltBlock(value) {
  if (!type.isObject(value)) return false;
  return !type.isUndefined(value.blockId) || !type.isUndefined(value.slots);
}

// buildEvents normalises every event to { try, catch }. An author writes the
// bare action list whenever there is no catch, so write that back.
function toAuthoredEvents(events) {
  const authored = {};
  Object.keys(events).forEach((eventName) => {
    const event = events[eventName];
    if (!type.isObject(event) || !type.isArray(event.try)) {
      authored[eventName] = toAuthoredConfig(event);
      return;
    }
    const tryActions = toAuthoredConfig(event.try);
    const catchActions = toAuthoredConfig(event.catch ?? []);
    if (catchActions.length === 0) {
      authored[eventName] = tryActions;
      return;
    }
    authored[eventName] = { try: tryActions, catch: catchActions };
  });
  return authored;
}

// moveAreasToSlots turned `blocks:` into the default slot and `areas:` into the
// named ones. Reverse it so the result is the config an author would type.
function toAuthoredSlots({ slots, target }) {
  const areas = {};
  Object.keys(slots).forEach((slotName) => {
    const slot = toAuthoredConfig(slots[slotName]);
    if (slotName === DEFAULT_SLOT && Object.keys(slot).length === 1 && type.isArray(slot.blocks)) {
      target.blocks = slot.blocks;
      return;
    }
    areas[slotName] = slot;
  });
  if (Object.keys(areas).length > 0) {
    target.areas = areas;
  }
}

function toAuthoredBlock(block) {
  const authored = {};
  // The author's id, first, so the written YAML reads like config and not like
  // an artifact dump.
  if (!type.isUndefined(block.blockId)) {
    authored.id = block.blockId;
  }
  Object.keys(block).forEach((key) => {
    if (MARKER_KEYS.includes(key)) return;
    if (DERIVED_BLOCK_KEYS.includes(key)) return;
    if (key === 'id' && !type.isUndefined(block.blockId)) return;
    if (key === 'slots') return;
    if (key === 'events') {
      authored.events = toAuthoredEvents(block.events);
      return;
    }
    authored[key] = toAuthoredConfig(block[key]);
  });
  if (type.isObject(block.slots)) {
    toAuthoredSlots({ slots: block.slots, target: authored });
  }
  return authored;
}

// Turns a deserialized build artifact back into the config an author would have
// written for it: build markers stripped, generated ids un-prefixed, slots back
// to blocks/areas and events back to their action lists.
function toAuthoredConfig(value) {
  if (type.isArray(value)) {
    return value.map((item) => toAuthoredConfig(item));
  }
  if (!type.isObject(value)) return value;
  if (isBuiltBlock(value)) return toAuthoredBlock(value);
  const authored = {};
  Object.keys(value).forEach((key) => {
    if (MARKER_KEYS.includes(key)) return;
    authored[key] = toAuthoredConfig(value[key]);
  });
  return authored;
}

export { MARKER_KEYS, isBuiltBlock };
export default toAuthoredConfig;
