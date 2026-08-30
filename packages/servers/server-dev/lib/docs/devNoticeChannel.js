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
// Module-level fan-out from the dev server to every connected dev tab. The
// /api/reload SSE route (src/routes/reload.js) subscribes each stream and
// forwards broadcast entries as `dev-notice` events; the client's Reload.jsx
// hands them to the ErrorBar. A single process-wide list mirrors the tab
// registry in tabChannel.js, without the request/response correlation that
// channel needs.
const subscribers = new Set();

function subscribe(send) {
  subscribers.add(send);
  return function unsubscribe() {
    subscribers.delete(send);
  };
}

function broadcast(entry) {
  subscribers.forEach((send) => {
    try {
      send(entry);
    } catch {
      // A tab that closed between the abort and the delete must not take the
      // notice away from the tabs still listening.
    }
  });
}

export default { subscribe, broadcast };
