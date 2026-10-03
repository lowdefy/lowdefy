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

import net from 'node:net';
import { type } from '@lowdefy/helpers';
import { createClientAddressResolver } from '@lowdefy/node-utils';

import lowdefyConfig from '../build/config.js';
import { JOURNEY_COOKIES, readJourneyCookie } from './journeyCookies.js';

const resolveClientAddress = createClientAddressResolver({
  trustedProxies: lowdefyConfig.trustedProxies,
});

// The actor cookie's payload is the address; see journeyActor.js.
function readJourneyActorAddress(cookieHeader) {
  const address = readJourneyCookie({ cookieHeader, name: JOURNEY_COOKIES.actor.name });
  if (address === null || net.isIP(address) === 0) {
    return null;
  }
  return address;
}

// The dev server resolves the client address the way the production server
// does - the connection peer, or the hop behind a trusted proxy - except that
// its own headless browser gives each journey actor an address of its own.
function getClientAddress(c) {
  const journeyActorAddress = readJourneyActorAddress(c.req.header('cookie'));
  if (!type.isNone(journeyActorAddress)) {
    return journeyActorAddress;
  }
  return resolveClientAddress({
    peerAddress: c.env?.incoming?.socket?.remoteAddress,
    forwardedFor: c.req.header('x-forwarded-for'),
  });
}

export default getClientAddress;
