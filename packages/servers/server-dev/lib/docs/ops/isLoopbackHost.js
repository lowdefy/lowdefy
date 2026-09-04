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

// The dev MCP has no authentication: the loopback bind is the entire security
// boundary, and the ops tools put production data behind it. A tunnel
// (ngrok, a dev-container forward, `--host 0.0.0.0`) rewrites the Host the
// request arrives with, so the host the caller reached us on — not the bind
// address the manager chose — is what says whether that boundary still holds.
function isLoopbackHost(hostname) {
  if (typeof hostname !== 'string' || hostname === '') {
    return false;
  }
  const host = hostname.replace(/^\[/, '').replace(/\]$/, '').toLowerCase();
  if (host === 'localhost' || host.endsWith('.localhost')) {
    return true;
  }
  if (host === '::1' || host === '0:0:0:0:0:0:0:1') {
    return true;
  }
  return /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host);
}

export default isLoopbackHost;
