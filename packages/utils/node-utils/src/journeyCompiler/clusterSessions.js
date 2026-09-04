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

import hashSequence from './hashSequence.js';
import rankGroups from './rankGroups.js';
import sessionSequence from './sessionSequence.js';

const MAX_SAMPLE_RIDS = 5;

function hasFailure({ session }) {
  return session.events.some((event) => event.success === false);
}

// The candidate a group compiles from. A failing session is preferred because a
// reproduction is the whole reason the group is interesting; otherwise the
// earliest session wins, so the same trace always produces the same file.
function representative({ sessions }) {
  return sessions.find((session) => hasFailure({ session })) ?? sessions[0];
}

function sampleRids({ sessions }) {
  const rids = [];
  sessions.forEach((session) => {
    if (session.rid !== null && !rids.includes(session.rid)) rids.push(session.rid);
  });
  return rids.slice(0, MAX_SAMPLE_RIDS);
}

// Sessions that drove the same (page, block, event) sequence are the same
// journey done more than once, so they become one candidate carrying how often
// it happened and how often it broke. This is the arithmetic the framework owes
// the agent: asked to cluster ten thousand rows, a model invents structure.
//
// A session whose sequence is empty - every event was mount-class - is not a
// journey and is left out rather than clustered into one big empty group.
function clusterSessions({ sessions }) {
  const byHash = new Map();
  sessions.forEach((session) => {
    const sequence = sessionSequence({ session });
    if (sequence.length === 0) return;
    const hash = hashSequence({ sequence });
    if (!byHash.has(hash)) {
      byHash.set(hash, { hash, page_id: session.page_id, sequence, sessions: [] });
    }
    byHash.get(hash).sessions.push(session);
  });

  const groups = [...byHash.values()].map((group) => ({
    ...group,
    failures: group.sessions.filter((session) => hasFailure({ session })).length,
    first_seen: group.sessions.map((session) => session.first_seen).sort()[0],
    last_seen: group.sessions
      .map((session) => session.last_seen)
      .sort()
      .reverse()[0],
    representative: representative({ sessions: group.sessions }),
    sample_rids: sampleRids({ sessions: group.sessions }),
  }));

  return rankGroups({ groups });
}

export { MAX_SAMPLE_RIDS };

export default clusterSessions;
