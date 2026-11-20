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

// Stands in for client-core's websocket client (createWebSocketClient) on a headless page, which
// has no server socket. A subscribe succeeds at once, as the server's ack would answer it: the
// engine's onConnected runs (the channel reads connected, its onSubscribe event fires), and no
// message ever arrives. A page that only holds a live feed runs headless; a journey that waits
// for a live message fails on that wait. An unsubscribe has nothing to close. A publish needs the
// server's channel, so it tells onBrowserOnly, which marks the journey browser-only, and throws as
// a browser-only action's stub does.
function createInertWebSocketClient({ onBrowserOnly }) {
  return {
    publish: async ({ websocketId }) => {
      const reason = `Publish to "${websocketId}" needs the browser.`;
      onBrowserOnly(reason);
      throw new Error(reason);
    },
    subscribe: async ({ handlers }) => {
      handlers.onConnected();
    },
    unsubscribe: () => undefined,
  };
}

export default createInertWebSocketClient;
