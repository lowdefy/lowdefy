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

// The page's websocket (and in dev, Vite's hot reload socket) connects to the host the page
// was served from. Older browsers do not match 'self' against ws: and wss:, so the policy
// names that host. ws: is listed only when the request itself arrived over plain http.
// A host that is not a plain hostname, IPv4 or bracketed IPv6 address with an optional
// port is not written into the header.
const HOST_PATTERN = /^([a-z0-9.-]+|\[[0-9a-f:.]+\])(:\d+)?$/i;

function getWebSocketSources({ requestUrl }) {
  const { host, protocol } = new URL(requestUrl);
  if (!HOST_PATTERN.test(host)) {
    return [];
  }
  if (protocol === 'http:') {
    return [`ws://${host}`, `wss://${host}`];
  }
  return [`wss://${host}`];
}

export default getWebSocketSources;
