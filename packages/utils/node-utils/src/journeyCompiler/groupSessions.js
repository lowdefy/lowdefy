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

import eventTime from './eventTime.js';

// One session in one page instance is one journey: a journey opens a page and
// drives it, so a second tab or a second visit is a second candidate rather
// than more steps on the first.
function sessionKey({ event }) {
  return `${event.session_id} ${event.page_instance ?? ''}`;
}

function groupSessions({ events }) {
  const byKey = new Map();
  events.forEach((event) => {
    const key = sessionKey({ event });
    if (!byKey.has(key)) {
      byKey.set(key, {
        events: [],
        page_instance: event.page_instance,
        session_id: event.session_id,
      });
    }
    byKey.get(key).events.push(event);
  });

  const sessions = [...byKey.values()];
  sessions.forEach((session) => {
    session.events.sort((a, b) => eventTime({ event: a }) - eventTime({ event: b }));
    // The page a journey opens is the page its first event fired on; a Link
    // inside the session navigates and the journey continues there.
    session.page_id = session.events[0].page_id;
    session.first_seen = session.events[0].t;
    session.last_seen = session.events[session.events.length - 1].t;
    session.rid = session.events.map((event) => event.rid).find((rid) => rid !== null) ?? null;
  });
  sessions.sort((a, b) => eventTime({ event: a.events[0] }) - eventTime({ event: b.events[0] }));
  return sessions;
}

export default groupSessions;
