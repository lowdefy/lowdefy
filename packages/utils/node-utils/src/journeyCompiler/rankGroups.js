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

// Two rankings, because they answer two questions: by sessions is what users
// do, by failures is what breaks. Both are stamped on the candidate so the file
// itself says where it sits, and ties break on the hash so a rerun over the
// same trace produces the same numbers.
function rankBy({ groups, metric }) {
  const order = [...groups].sort((a, b) => {
    if (b[metric] !== a[metric]) return b[metric] - a[metric];
    return a.hash.localeCompare(b.hash);
  });
  return new Map(order.map((group, index) => [group.hash, index + 1]));
}

function rankGroups({ groups }) {
  const withCounts = groups.map((group) => ({ ...group, sessionCount: group.sessions.length }));
  const bySessions = rankBy({ groups: withCounts, metric: 'sessionCount' });
  const byFailures = rankBy({ groups: withCounts, metric: 'failures' });

  return withCounts
    .map((group) => ({
      ...group,
      rank: { by_failures: byFailures.get(group.hash), by_sessions: bySessions.get(group.hash) },
    }))
    .sort((a, b) => a.rank.by_sessions - b.rank.by_sessions);
}

export default rankGroups;
