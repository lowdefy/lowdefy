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

import { pairTraceEvents } from '@lowdefy/helpers';

const INTERACTION_KINDS = ['click', 'change'];

function groupBySession({ entries }) {
  const groups = new Map();
  entries.forEach((entry) => {
    const { session } = entry.record ?? entry.failure;
    if (!groups.has(session)) groups.set(session, []);
    groups.get(session).push(entry);
  });
  return groups;
}

// Joins each lowdefy_event_failed to the interaction that caused it through
// the one pairing rule every trace source uses, tab by tab. A paired failure
// fills the interaction's `event` (the first) and `also` (the rest); one the
// rule leaves unpaired (mount-class, app or programmatic) stays a
// `kind: engine` record. Entries are { record, id, blockIds } and
// { failure, id, pairing }; returns record entries.
function pairFailures({ records, failures }) {
  const result = [...records];
  const recordsBySession = groupBySession({ entries: records });
  groupBySession({ entries: failures }).forEach((sessionFailures, session) => {
    const interactions = (recordsBySession.get(session) ?? []).filter((entry) =>
      INTERACTION_KINDS.includes(entry.record.kind)
    );
    const { pairs } = pairTraceEvents({
      interactions: interactions.map((entry) => ({
        id: entry.id,
        t: Date.parse(entry.record.t),
        blockIds: entry.blockIds ?? [],
      })),
      events: sessionFailures.map((entry) => ({ id: entry.id, ...entry.pairing })),
    });
    const failureById = new Map(sessionFailures.map((entry) => [entry.id, entry]));
    const interactionById = new Map(interactions.map((entry) => [entry.id, entry]));
    const paired = new Set();
    pairs.forEach(({ interactionId, eventIds }) => {
      const { record } = interactionById.get(interactionId);
      const [first, ...rest] = eventIds.map((id) => failureById.get(id).failure.event);
      record.event = first;
      if (rest.length > 0) record.also = rest;
      eventIds.forEach((id) => paired.add(id));
    });
    sessionFailures
      .filter((entry) => !paired.has(entry.id))
      .forEach((entry) => {
        result.push({ record: entry.failure, id: entry.id });
      });
  });
  return result;
}

export default pairFailures;
