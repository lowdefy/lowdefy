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

import { type } from '@lowdefy/helpers';
import { createClientAddressResolver } from '@lowdefy/node-utils';

import config from '../build/config.js';

const resolveClientAddress = createClientAddressResolver({
  trustedProxies: config.trustedProxies,
});

let unconfiguredProxyWarned = false;

// The address of the client a request came from, resolved once per request by
// apiContext. A platform entry whose edge sets the client address on every
// request (Vercel's x-real-ip) names that header. Otherwise the address is the
// connection's peer, which @hono/node-server hands the app as c.env.incoming,
// or the hop behind it when the peer is one of config.trustedProxies. A request
// the app receives without a Node connection (app.fetch from a test) has no
// peer, and its address is unknown.
function getClientAddress({ c, clientAddressHeader, logger }) {
  if (type.isString(clientAddressHeader)) {
    return c.req.header(clientAddressHeader) ?? null;
  }
  const forwardedFor = c.req.header('x-forwarded-for');
  if (
    !unconfiguredProxyWarned &&
    type.isString(forwardedFor) &&
    type.isNone(config.trustedProxies)
  ) {
    unconfiguredProxyWarned = true;
    logger.warn(
      'A request carried X-Forwarded-For, which is ignored because config.trustedProxies is not set: the client address is the connecting peer. If the app runs behind a reverse proxy or load balancer, add its address to config.trustedProxies, or every client shares the proxy address for auth rate limits.'
    );
  }
  return resolveClientAddress({
    peerAddress: c.env?.incoming?.socket?.remoteAddress,
    forwardedFor,
  });
}

export default getClientAddress;
