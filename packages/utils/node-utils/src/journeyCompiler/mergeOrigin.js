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

import { MAX_SAMPLE_RIDS } from './clusterSessions.js';

function earliest(values) {
  return values.filter((value) => type.isString(value)).sort()[0];
}

function latest(values) {
  return values
    .filter((value) => type.isString(value))
    .sort()
    .reverse()[0];
}

// `sessions` and `failures` describe the trace the candidate was last compiled
// from, not a running total: a total kept across runs would double every time
// the same trace was compiled twice, and a compiler whose output changes when
// its input does not is not a compiler. What does carry across is the window
// the candidate has been seen in and the rids that reproduce it.
function mergeOrigin({ existing, origin }) {
  if (type.isNone(existing)) return origin;
  const rids = [...(origin.sample_rids ?? [])];
  (existing.sample_rids ?? []).forEach((rid) => {
    if (type.isString(rid) && !rids.includes(rid)) rids.push(rid);
  });
  return {
    ...origin,
    first_seen: earliest([existing.first_seen, origin.first_seen]),
    last_seen: latest([existing.last_seen, origin.last_seen]),
    sample_rids: rids.slice(0, MAX_SAMPLE_RIDS),
  };
}

export default mergeOrigin;
