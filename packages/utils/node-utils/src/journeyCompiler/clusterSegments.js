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

import { MAX_SAMPLE_SESSIONS } from './mergeOrigin.js';
import rankClusters from './rankClusters.js';

function distinct(values) {
  return [...new Set(values)].sort();
}

// The segment a candidate is compiled from: a failing one when there is one,
// since a reproduction is why the cluster matters, otherwise the latest - the
// last attempt, on the newest config. Either choice is deterministic.
function representative({ segments }) {
  const failing = segments.filter((segment) => !type.isUndefined(segment.failure));
  const pool = failing.length > 0 ? failing : segments;
  return pool.reduce((latest, segment) =>
    segment.last_seen >= latest.last_seen ? segment : latest
  );
}

// Segments with the same hash are the same journey done more than once, so
// they become one candidate carrying how often it happened, by how many
// people, and how often it broke.
function clusterSegments({ segments }) {
  const byHash = new Map();
  segments.forEach((segment) => {
    if (!byHash.has(segment.hash)) byHash.set(segment.hash, []);
    byHash.get(segment.hash).push(segment);
  });
  const clusters = [...byHash.entries()].map(([hash, members]) => ({
    hash,
    segments: members,
    sessions: members.length,
    persons: distinct(members.flatMap((segment) => segment.persons)).length,
    orgs: distinct(members.flatMap((segment) => segment.orgs)).length,
    failures: members.filter((segment) => !type.isUndefined(segment.failure)).length,
    first_seen: members.map((segment) => segment.first_seen).sort()[0],
    last_seen: members
      .map((segment) => segment.last_seen)
      .sort()
      .reverse()[0],
    builds: distinct(members.flatMap((segment) => segment.builds)),
    representative: representative({ segments: members }),
    sample_sessions: distinct(members.map((segment) => segment.session)).slice(
      0,
      MAX_SAMPLE_SESSIONS
    ),
  }));
  return rankClusters({ clusters });
}

export default clusterSegments;
