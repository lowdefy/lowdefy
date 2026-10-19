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

import { pairTraceEvents, type } from '@lowdefy/helpers';

import buildEngineRecord from './buildEngineRecord.js';
import buildInteractionRecord from './buildInteractionRecord.js';
import buildTraceEvent from './buildTraceEvent.js';

// How long an interaction waits for the events it caused. The pairing rule
// decides by when an event's actions started (within its debounce plus 1 s of
// the interaction), but the trace hook reports an event when its actions
// finish, and a click's Request can take seconds. Holding each interaction
// this long lets a slow event, and a `bubble: true` sibling, still join it.
const HOLD_MS = 10000;
const PAIRED_KINDS = ['click', 'change', 'key'];

function hasTargetIdentity(target) {
  return (
    !type.isNone(target) &&
    ((type.isString(target.block_id) && target.block_id !== '') ||
      (type.isString(target.text) && target.text !== ''))
  );
}

// Turns DOM interactions and engine trace payloads into finished v1 trace
// records, paired in the tab with the shared pairing rule. Each record carries
// the build getBuild() named when its interaction was captured or its event
// arrived, never when its hold closes: a hold can outlast a config reload.
//
// - addInteraction({ t, kind, element, target, pageId, pathParams, value, key, url, build }):
//   pageview and back are recorded at once; click, change and key wait until
//   their hold ends, collecting the events the rule pairs with them. `build`
//   is given only by a caller that knows it better than getBuild() does now
//   (a pageview, recorded once its page config has rendered).
// - addEvent(payload, { urlAfter }): the event is built into a trace event
//   now (its state writes are read against the state as it is now), then
//   paired with the latest open interaction that could have caused it, or
//   recorded at once as kind engine. Every interaction that could cause an
//   event happened before the event started, so it is already in the buffer.
// - flushAll(): ends every hold now (pagehide, config reload, headless flush).
function createPairingBuffer({
  onRecord,
  now = Date.now,
  getSession,
  getRoles = () => [],
  getBuild = () => null,
  redactor,
}) {
  let open = [];
  let nextId = 1;
  let timer = null;

  function emit(record) {
    onRecord(redactor === undefined ? record : redactor.redact(record));
  }

  function finalise(interaction) {
    let paired = [];
    if (interaction.events.length > 0) {
      const { pairs } = pairTraceEvents({
        interactions: [interaction],
        events: interaction.events,
      });
      const order = pairs[0]?.eventIds ?? interaction.events.map((event) => event.id);
      paired = order.map((id) => interaction.events.find((event) => event.id === id).traceEvent);
    }
    emit(
      buildInteractionRecord({
        interaction,
        paired,
        session: getSession(),
        roles: getRoles(),
      })
    );
  }

  function schedule() {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    if (open.length === 0) return;
    const next = Math.min(...open.map((interaction) => interaction.closesAt));
    timer = setTimeout(closeDue, Math.max(0, next - now()));
  }

  function closeDue() {
    timer = null;
    const time = now();
    const due = open.filter((interaction) => interaction.closesAt <= time);
    open = open.filter((interaction) => interaction.closesAt > time);
    due.forEach(finalise);
    schedule();
  }

  function addInteraction({
    t,
    kind,
    element,
    target,
    pageId,
    pathParams,
    value,
    key,
    url,
    build: named,
  }) {
    const time = t ?? now();
    const build = type.isUndefined(named) ? getBuild() : named;
    if (!PAIRED_KINDS.includes(kind)) {
      emit(
        buildInteractionRecord({
          interaction: { t: time, kind, pageId, pathParams, url, target: null, build },
          session: getSession(),
          roles: getRoles(),
        })
      );
      return;
    }
    // A click or change the runner could not target (no block, no text) can
    // be neither replayed nor paired.
    if (kind !== 'key' && !hasTargetIdentity(target)) return;
    if (redactor !== undefined && !type.isNone(element) && redactor.isPassword(element)) {
      redactor.remember(target?.block_id);
    }
    open.push({
      id: `i${nextId++}`,
      t: time,
      kind,
      pageId,
      value,
      key,
      target: kind === 'key' && !hasTargetIdentity(target) ? null : target,
      blockIds: target?.block_ids ?? [],
      build,
      events: [],
      closesAt: time + HOLD_MS,
    });
    schedule();
  }

  function addEvent(payload, { urlAfter } = {}) {
    const engineEvent = {
      id: `e${nextId++}`,
      blockId: payload.blockId,
      eventName: payload.eventName,
      startTimestamp: new Date(payload.record?.startTimestamp ?? now()).getTime(),
      debounceMs: payload.debounceMs ?? 0,
      scope: payload.scope,
      pageId: payload.pageId,
      build: getBuild(),
      traceEvent: buildTraceEvent({ payload, urlAfter }),
    };
    const { pairs } = pairTraceEvents({ interactions: open, events: [engineEvent] });
    if (pairs.length === 0) {
      emit(buildEngineRecord({ engineEvent, session: getSession(), roles: getRoles() }));
      return;
    }
    open.find((interaction) => interaction.id === pairs[0].interactionId).events.push(engineEvent);
  }

  function flushAll() {
    const all = open;
    open = [];
    all.forEach(finalise);
    schedule();
  }

  return { addEvent, addInteraction, flushAll };
}

export { HOLD_MS };
export default createPairingBuffer;
