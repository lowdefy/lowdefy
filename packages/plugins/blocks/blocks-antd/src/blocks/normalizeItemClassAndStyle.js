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
import { cn } from '@lowdefy/block-utils';

const ITEM_SLOT_KEYS = ['element', 'icon', 'label', 'popup'];

function isSlotKeyed(value) {
  return Object.keys(value).some((k) => k.startsWith('.'));
}

function partitionStyle(style) {
  const slots = { element: undefined, icon: undefined, label: undefined, popup: undefined };
  if (type.isNone(style)) return slots;
  if (!type.isObject(style)) return slots;
  if (!isSlotKeyed(style)) {
    slots.element = style;
    return slots;
  }
  for (const [key, value] of Object.entries(style)) {
    if (!key.startsWith('.')) continue;
    const slot = key.slice(1);
    if (ITEM_SLOT_KEYS.includes(slot)) slots[slot] = value;
  }
  return slots;
}

function partitionClass(classValue) {
  const slots = { element: undefined, icon: undefined, label: undefined, popup: undefined };
  if (type.isNone(classValue)) return slots;
  if (type.isString(classValue) || type.isArray(classValue)) {
    slots.element = cn(classValue);
    return slots;
  }
  if (!type.isObject(classValue)) return slots;
  if (!isSlotKeyed(classValue)) {
    slots.element = cn(classValue);
    return slots;
  }
  for (const [key, value] of Object.entries(classValue)) {
    if (!key.startsWith('.')) continue;
    const slot = key.slice(1);
    if (ITEM_SLOT_KEYS.includes(slot)) slots[slot] = cn(value);
  }
  return slots;
}

function normalizeItemClassAndStyle(link) {
  return {
    class: partitionClass(link?.class),
    style: partitionStyle(link?.style),
  };
}

export default normalizeItemClassAndStyle;
export { partitionClass, partitionStyle };
