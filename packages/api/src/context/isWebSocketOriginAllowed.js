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

import getCurrentEnvironment from './getCurrentEnvironment.js';
import isSameOriginRequest from './isSameOriginRequest.js';

// The app's public origin: its auth URL (AUTH_URL, or NEXTAUTH_URL as Auth.js
// reads it), else the current environment's url - deployment config, never
// read from the request.
function getPublicOrigins({ context }) {
  const canonicalUrl =
    process.env.AUTH_URL ??
    process.env.NEXTAUTH_URL ??
    getCurrentEnvironment({ config: context.config })?.url;
  return type.isNone(canonicalUrl) ? [] : [canonicalUrl];
}

// Browsers open a websocket to any host a page names, so a websocket upgrade
// is accepted only from the app's own pages, or from a client that sends no
// Origin (a server or a script). A browser cannot set headers on a websocket
// handshake, so X-Forwarded-Host is accepted here, where a proxy or CDN in
// front of the app rewrites Host; the app's configured public origins are too.
// A refusal is logged, since behind a proxy that passes neither it would
// otherwise be a silent 403 on every upgrade.
function isWebSocketOriginAllowed({ context, getHeader }) {
  const allowed = isSameOriginRequest({
    getHeader,
    allowNoOrigin: true,
    acceptForwardedHost: true,
    publicOrigins: getPublicOrigins({ context }),
  });
  if (!allowed) {
    context.logger.warn(
      {
        event: 'ws_origin_refused',
        origin: getHeader('origin'),
        host: getHeader('host'),
        forwardedHost: getHeader('x-forwarded-host'),
      },
      `WebSocket upgrade refused: Origin ${getHeader('origin')} is not this app (Host ${getHeader(
        'host'
      )}). Behind a proxy, pass the original Host or set X-Forwarded-Host.`
    );
  }
  return allowed;
}

export default isWebSocketOriginAllowed;
