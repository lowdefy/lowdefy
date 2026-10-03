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

const MAX_SAMPLE_SESSIONS = 5;

function earliest(values) {
  return values.filter((value) => type.isString(value)).sort()[0];
}

function latest(values) {
  return values
    .filter((value) => type.isString(value))
    .sort()
    .reverse()[0];
}

// Counts describe the latest compile, not a running total: a total kept across
// runs would double every time the same trace was compiled twice. What carries
// across is the window the candidate has been seen in and the sessions that
// reproduce it.
function mergeOrigin({ existing, origin }) {
  if (type.isNone(existing)) return origin;
  const samples = [...(origin.sample_sessions ?? [])];
  (existing.sample_sessions ?? []).forEach((session) => {
    if (type.isString(session) && !samples.includes(session)) samples.push(session);
  });
  return {
    ...origin,
    first_seen: earliest([existing.first_seen, origin.first_seen]),
    last_seen: latest([existing.last_seen, origin.last_seen]),
    sample_sessions: samples.slice(0, MAX_SAMPLE_SESSIONS),
  };
}

export { MAX_SAMPLE_SESSIONS };

export default mergeOrigin;
