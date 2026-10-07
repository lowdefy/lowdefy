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

import { isIP } from 'node:net';
import { buildConnector } from 'undici';

import lookupPublicAddress from './lookupPublicAddress.js';

const connect = buildConnector({ lookup: lookupPublicAddress });

// The undici connector for an agent file download: it opens a socket only to a public address,
// for the first link and every redirect alike. A socket to an IP literal skips the lookup, so a
// literal is checked here before connecting.
function connectPublic(options, callback) {
  if (isIP(options.hostname) === 0) {
    connect(options, callback);
    return;
  }
  lookupPublicAddress(options.hostname, { all: true }, (error) => {
    if (error) {
      callback(error, null);
      return;
    }
    connect(options, callback);
  });
}

export default connectPublic;
