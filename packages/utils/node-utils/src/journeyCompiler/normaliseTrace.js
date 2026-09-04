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

import dropReason from './dropReason.js';
import groupSessions from './groupSessions.js';
import parseTraceEvents from './parseTraceEvents.js';

// The trace as the rest of the compiler sees it: real events only, grouped by
// session and page instance, ordered by time. Everything dropped is counted, so
// the command can say what it threw away instead of quietly compiling half a
// corpus.
function normaliseTrace({ trace }) {
  const { events, unparsable } = parseTraceEvents({ trace });
  const dropped = { bounced: 0, pending: 0, unparsable };
  const kept = events.filter((event) => {
    const reason = dropReason({ event });
    if (reason === undefined) return true;
    dropped[reason] += 1;
    return false;
  });
  return { dropped, sessions: groupSessions({ events: kept }) };
}

export default normaliseTrace;
