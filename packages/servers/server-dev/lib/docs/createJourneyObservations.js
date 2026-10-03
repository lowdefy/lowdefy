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

import normaliseBlockId from './normaliseBlockId.js';

// What a journey's pages reported from inside: the Lowdefy events that
// completed (the engine's trace hook) and the blocks that were ever visible.
// Fed by every actor's page through the __lowdefyJourneyObserve binding
// (client/journeyObserver) and by the runner's own sample at each step's
// settle. Messages come from page JavaScript, so a malformed one is dropped
// rather than trusted.
function createJourneyObservations() {
  const events = new Map();
  const rendered = new Map();

  function addEvent({ scope, pageId, blockId, eventName, actionIds }) {
    if (![scope, pageId, blockId, eventName].every((value) => type.isString(value))) {
      return;
    }
    const event = {
      scope,
      pageId,
      blockId: normaliseBlockId(blockId),
      eventName,
      actionIds: type.isArray(actionIds) ? actionIds.filter((id) => type.isString(id)) : [],
    };
    events.set(JSON.stringify(event), event);
  }

  function addRendered({ pageId, blockIds }) {
    if (!type.isString(pageId) || !type.isArray(blockIds)) {
      return;
    }
    const ids = rendered.get(pageId) ?? new Set();
    blockIds
      .filter((blockId) => type.isString(blockId))
      .forEach((blockId) => ids.add(normaliseBlockId(blockId)));
    rendered.set(pageId, ids);
  }

  function receive(message) {
    if (!type.isObject(message)) {
      return;
    }
    if (message.kind === 'event') {
      addEvent(message);
      return;
    }
    if (message.kind === 'rendered') {
      addRendered(message);
    }
  }

  function snapshot() {
    return {
      events: [...events.values()],
      rendered: Object.fromEntries(
        [...rendered.entries()].map(([pageId, ids]) => [pageId, [...ids].sort()])
      ),
    };
  }

  return { receive, snapshot };
}

export default createJourneyObservations;
