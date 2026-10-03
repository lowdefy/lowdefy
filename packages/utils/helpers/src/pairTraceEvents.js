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

import isMountEventName from './isMountEventName.js';
import type from './type.js';

// Absorbs event-loop and render delay between the DOM interaction and the
// moment the engine starts the event's actions, without reaching back to an
// unrelated earlier click.
const PAIRING_SLACK_MS = 1000;

function canBeCaused({ event }) {
  return event.scope !== 'app' && !isMountEventName({ eventName: event.eventName });
}

// An interaction can have caused an event when the event's block encloses the
// interaction's target (the handler is on the clicked block or an ancestor of
// it) and the event started no later than its debounce plus the slack after
// the interaction.
function couldCause({ event, interaction }) {
  if (!type.isArray(interaction.blockIds) || !interaction.blockIds.includes(event.blockId)) {
    return false;
  }
  const delay = event.startTimestamp - interaction.t;
  const windowMs = (event.debounceMs ?? 0) + PAIRING_SLACK_MS;
  return delay >= 0 && delay <= windowMs;
}

function findCause({ event, interactions }) {
  let cause;
  interactions.forEach((interaction) => {
    if (!couldCause({ event, interaction })) return;
    if (type.isUndefined(cause) || interaction.t >= cause.t) {
      cause = interaction;
    }
  });
  return cause;
}

// Decides which DOM interaction caused which engine event, so a trace record
// means the same thing whichever source wrote it: the dev recorder runs this in
// the browser, the production pull in Node.
//
// - interactions: [{ id, t, blockIds }], `t` epoch ms, `blockIds` innermost first.
// - events: [{ id, blockId, eventName, startTimestamp, debounceMs, scope }].
//
// Mount-class and app events are never paired. Any other event pairs with the
// latest interaction that could have caused it; an event with none is
// programmatic and goes to `unpaired`. Within a pair, events on the innermost
// block come first, then the earliest, so the record builder takes the first
// as `event` and the rest as `also`.
function pairTraceEvents({ interactions, events }) {
  const byInteraction = new Map();
  const unpaired = [];
  events.forEach((event, order) => {
    const cause = canBeCaused({ event }) ? findCause({ event, interactions }) : undefined;
    if (type.isUndefined(cause)) {
      unpaired.push(event.id);
      return;
    }
    if (!byInteraction.has(cause)) byInteraction.set(cause, []);
    byInteraction.get(cause).push({
      depth: cause.blockIds.indexOf(event.blockId),
      event,
      order,
    });
  });

  const pairs = interactions
    .filter((interaction) => byInteraction.has(interaction))
    .map((interaction) => {
      const paired = [...byInteraction.get(interaction)].sort((a, b) => {
        if (a.depth !== b.depth) return a.depth - b.depth;
        if (a.event.startTimestamp !== b.event.startTimestamp) {
          return a.event.startTimestamp - b.event.startTimestamp;
        }
        return a.order - b.order;
      });
      return { interactionId: interaction.id, eventIds: paired.map((entry) => entry.event.id) };
    });

  return { pairs, unpaired };
}

export { PAIRING_SLACK_MS };

export default pairTraceEvents;
