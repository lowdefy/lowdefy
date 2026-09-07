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

const MOUNT_EVENTS = ['onMount', 'onMountAsync'];

// The blockIds in a built page config that declare a mount event. The engine
// has no mount lifecycle — the client's Block.js fires `onMount`/`onMountAsync`
// — so a headless render never runs them, and a page that loads its data there
// renders empty. Collected here so the generation can warn by name instead of
// shipping a blank document with no explanation.
//
// Children nest under `block.slots.{area}.blocks[]` after the build's
// moveAreasToSlots step, the same shape collectReportOptions walks.
function collectMountEvents(pageConfig) {
  const blockIds = [];

  const visit = (block) => {
    if (type.isNone(block)) return;
    const events = type.isObject(block.events) ? block.events : {};
    if (MOUNT_EVENTS.some((eventName) => !type.isNone(events[eventName]))) {
      blockIds.push(block.blockId ?? block.id);
    }
    Object.values(block.slots ?? {}).forEach((area) => {
      (area?.blocks ?? []).forEach(visit);
    });
  };

  visit(pageConfig);
  return blockIds;
}

export default collectMountEvents;
