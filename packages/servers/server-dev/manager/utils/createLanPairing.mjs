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

import crypto from 'node:crypto';

import getLanAddress from './getLanAddress.mjs';

// `lowdefy dev --lan [interface]` sets LOWDEFY_SERVER_DEV_LAN to "true" or to
// the interface name. The token lasts as long as this dev server.
function createLanPairing({ lan, interfaces }) {
  if (lan === undefined) {
    return null;
  }
  const { name, address } = getLanAddress({
    interfaceName: lan === 'true' ? undefined : lan,
    interfaces,
  });
  return { name, address, token: crypto.randomBytes(32).toString('base64url') };
}

export default createLanPairing;
