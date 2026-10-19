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

import formatSessionLog from './formatSessionLog.js';
import summariseSessions from './summariseSessions.js';

const NEWEST_SHOWN = 5;

function describeUnknown({ id, sessions }) {
  if (sessions.length === 0) {
    return `No session "${id}" in this window: there are no sessions in it.`;
  }
  const newest = sessions.slice(0, NEWEST_SHOWN).map((session) => session.id);
  return `No session "${id}" in this window. The newest sessions are ${newest.join(', ')}.`;
}

// What `lowdefy journeys session` and the lowdefy_journey_session tool answer,
// from the records of a window: without an id, { sessions } (summariseSessions,
// newest first); with one, { log } (formatSessionLog), or { error } naming the
// id and the newest sessions when the window has no session with that id.
function buildSessionReport({ records, id, blockMetas = {} }) {
  if (type.isNone(id)) {
    return { sessions: summariseSessions({ records }) };
  }
  const sessionRecords = records.filter((record) => record?.session === id);
  const sessions = summariseSessions({ records });
  if (!sessions.some((session) => session.id === id)) {
    return { error: describeUnknown({ id, sessions }) };
  }
  return { log: formatSessionLog({ records: sessionRecords, blockMetas }) };
}

export default buildSessionReport;
