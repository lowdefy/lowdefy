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

// sendBeacon is the only send that survives the page unloading, so it is the
// primary path. Its return value is not decoration: the browser caps all
// in-flight beacons at 64 KB and answers false, silently, when a body will not
// fit. A refused beacon falls back to a keepalive fetch, which survives unload
// too and reports its own failure.
function createJourneySender({ url, window }) {
  return function sendJourneyBatch(events) {
    const body = JSON.stringify({ events });
    const blob = new window.Blob([body], { type: 'application/json' });
    if (window.navigator?.sendBeacon?.(url, blob) === true) {
      return;
    }
    window
      .fetch(url, {
        body,
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        method: 'POST',
      })
      .catch(() => {
        // A lost journey batch is not worth an error in the user's console.
      });
  };
}

export default createJourneySender;
