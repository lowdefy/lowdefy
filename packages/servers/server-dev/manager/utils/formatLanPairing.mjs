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

import renderTerminalQr from './renderTerminalQr.mjs';

// The link Lowdefy Dev opens: it asks "Connect to <host>?" before it attaches.
function formatLanPairing({ lan, port, basePath }) {
  const url = `http://${lan.address}:${port}${basePath}`;
  const link = `lowdefy-dev://connect?url=${encodeURIComponent(url)}&pair=${lan.token}`;
  return [
    `Phone pairing on ${lan.name} (${url}). Wrong network? Restart with --lan <interface>.`,
    'Scan this with Lowdefy Dev. Requests from other machines need the pairing token,',
    'and the dev tools answer only on this computer.',
    renderTerminalQr(link),
    link,
  ].join('\n');
}

export default formatLanPairing;
