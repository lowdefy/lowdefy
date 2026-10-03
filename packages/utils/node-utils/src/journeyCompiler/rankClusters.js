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

// Two rankings, because they answer two questions: by sessions is what people
// do, by failures is what breaks. Both are stamped on the candidate so the file
// says where it sits, and ties break on the hash so a rerun over the same
// records gives the same numbers.
function rankBy({ clusters, metric }) {
  const order = [...clusters].sort((a, b) => {
    if (b[metric] !== a[metric]) return b[metric] - a[metric];
    return a.hash.localeCompare(b.hash);
  });
  return new Map(order.map((cluster, index) => [cluster.hash, index + 1]));
}

function rankClusters({ clusters }) {
  const bySessions = rankBy({ clusters, metric: 'sessions' });
  const byFailures = rankBy({ clusters, metric: 'failures' });
  return clusters
    .map((cluster) => ({
      ...cluster,
      rank: {
        by_sessions: bySessions.get(cluster.hash),
        by_failures: byFailures.get(cluster.hash),
      },
    }))
    .sort((a, b) => a.rank.by_sessions - b.rank.by_sessions);
}

export default rankClusters;
