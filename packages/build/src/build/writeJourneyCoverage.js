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

// build/journeyCoverage.json is the denominator of `lowdefy test --coverage`:
// every (pageId, blockId, eventName) triple the app declares, plus each page's
// request ids. Written on every build, as { pages: {} } when the app has no
// pages, so the CLI never needs an existence check. The artifact shape is a
// contract - keep it stable.
//
// This is a static denominator: it counts events the config declares, not
// events users fire. When the production recorder lands, the same consumer
// reads a trace-weighted denominator instead.
function collectBlockEvents(blocks, events) {
  if (!type.isArray(blocks)) return;
  for (const block of blocks) {
    if (type.isNone(block)) continue;
    Object.keys(block.events ?? {})
      .filter((eventName) => !eventName.startsWith('~'))
      .sort()
      .forEach((eventName) => events.push({ blockId: block.blockId, event: eventName }));
    collectBlockEvents(block.blocks, events);
    for (const area of Object.values(block.areas ?? {})) {
      collectBlockEvents(area.blocks, events);
    }
    for (const slot of Object.values(block.slots ?? {})) {
      collectBlockEvents(slot.blocks, events);
    }
  }
}

function writeJourneyCoverage({ components, context }) {
  const pages = {};
  (components.pages ?? []).forEach((page) => {
    const events = [];
    collectBlockEvents([page], events);
    pages[page.pageId] = {
      events,
      requestIds: (page.requests ?? []).map((request) => request.requestId),
    };
  });
  return context.writeBuildArtifact('journeyCoverage.json', JSON.stringify({ pages }, null, 2));
}

export default writeJourneyCoverage;
