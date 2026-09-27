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
import net from 'node:net';
import { type } from '@lowdefy/helpers';
import { createClientAddressResolver } from '@lowdefy/node-utils';

import lowdefyConfig from '../build/config.js';
import { JOURNEY_ACTOR_COOKIE, journeyActorToken } from './auth/journeyActor.js';

const resolveClientAddress = createClientAddressResolver({
  trustedProxies: lowdefyConfig.trustedProxies,
});

const tokenBuffer = Buffer.from(journeyActorToken);

// The cookie value is "<token>.<address>"; see journeyActor.js.
function readJourneyActorAddress(cookieHeader) {
  const match = (cookieHeader ?? '').match(
    new RegExp(`(?:^|;\\s*)${JOURNEY_ACTOR_COOKIE}=([^;]+)`)
  );
  if (match === null) {
    return null;
  }
  const value = match[1];
  const separator = value.indexOf('.');
  if (separator === -1) {
    return null;
  }
  const token = Buffer.from(value.slice(0, separator));
  const address = value.slice(separator + 1);
  if (
    token.length !== tokenBuffer.length ||
    !crypto.timingSafeEqual(token, tokenBuffer) ||
    net.isIP(address) === 0
  ) {
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
