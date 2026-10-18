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

// The page shape the Lowdefy build writes for a page (as @lowdefy/build's buildTestPage gives
// it), for the few keys these tests use: block ids, events as try/catch chains, `blocks` moved
// into the content slot, and request ids. @lowdefy/build itself does not load under the React
// Native Jest preset.
function buildEvents(events) {
  if (type.isNone(events)) return undefined;
  return Object.fromEntries(
    Object.entries(events).map(([name, actions]) => [
      name,
      type.isArray(actions) ? { try: actions, catch: [] } : actions,
    ])
  );
}

function buildBlock({ block, pageId }) {
  const { blocks, events, id, slots, ...rest } = block;
  const built = { ...rest, id: `block:${pageId}:${id}:0`, blockId: id };
  if (!type.isNone(events)) built.events = buildEvents(events);
  const builtSlots = { ...(slots ?? {}) };
  if (type.isArray(blocks)) {
    builtSlots.content = { ...builtSlots.content, blocks };
  }
  if (Object.keys(builtSlots).length > 0) {
    built.slots = Object.fromEntries(
      Object.entries(builtSlots).map(([key, slot]) => [
        key,
        {
          ...slot,
          blocks: (slot.blocks ?? []).map((child) => buildBlock({ block: child, pageId })),
        },
      ])
    );
  }
  return built;
}

function buildPage(pageConfig) {
  const { id, requests = [], ...rest } = pageConfig;
  const root = buildBlock({ block: { id, ...rest }, pageId: id });
  return {
    ...root,
    id: `page:${id}`,
    pageId: id,
    blockId: id,
    path: id,
    linkPaths: {},
    subscriptions: [],
    requests: requests.map((request) => ({
      ...request,
      id: `request:${id}:${request.id}`,
      requestId: request.id,
      pageId: id,
    })),
  };
}

export default buildPage;
