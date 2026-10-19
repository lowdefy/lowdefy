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

// One journey's network path across all of its actors: the request path of a
// page any actor loaded, and each request or endpoint with the calls of every actor summed.
function mergeNetworkSnapshots({ snapshots }) {
  const pagePaths = new Set();
  const requests = new Map();
  const endpoints = new Map();
  let appEvents = false;
  snapshots.forEach((snapshot) => {
    snapshot.pagePaths.forEach((path) => pagePaths.add(path));
    appEvents = appEvents || snapshot.appEvents;
    snapshot.requests.forEach(({ pageId, requestId, calls }) => {
      const key = JSON.stringify([pageId, requestId]);
      const entry = requests.get(key) ?? { pageId, requestId, calls: 0 };
      entry.calls += calls;
      requests.set(key, entry);
    });
    snapshot.endpoints.forEach(({ endpointId, calls }) => {
      endpoints.set(endpointId, (endpoints.get(endpointId) ?? 0) + calls);
    });
  });
  return {
    pagePaths: [...pagePaths].sort(),
    appEvents,
    requests: [...requests.values()].sort(
      (a, b) => a.pageId.localeCompare(b.pageId) || a.requestId.localeCompare(b.requestId)
    ),
    endpoints: [...endpoints.entries()]
      .map(([endpointId, calls]) => ({ endpointId, calls }))
      .sort((a, b) => a.endpointId.localeCompare(b.endpointId)),
  };
}

export default mergeNetworkSnapshots;
