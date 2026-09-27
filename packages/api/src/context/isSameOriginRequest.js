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

// Browser-set values of Sec-Fetch-Site that mark a request this site's own
// pages made: `same-origin`, or `none` (user initiated, no initiator document).
const ALLOWED_FETCH_SITES = new Set(['same-origin', 'none']);

function getOriginHost(origin) {
  try {
    return new URL(origin).host;
  } catch {
    return null;
  }
}

// The one rule every server applies to routes only the app's own pages call:
// the cookie-bearing browser routes and websocket upgrades. Two headers decide
// it, both set by the browser and neither settable by page script.
// Sec-Fetch-Site is the browser's own answer to "where did this come from":
// `cross-site` and `same-site` are refused, so a sibling subdomain is too.
// Origin must then name the host the request arrived on (the Host header, so a
// reverse proxy must pass the original Host through).
//
// A caller that sends no Origin is not a browser acting for another site - a
// server, curl, an agent. It passes only where the route allows it.
function isSameOriginRequest({ getHeader, allowNoOrigin = false }) {
  const fetchSite = getHeader('sec-fetch-site');
  if (!type.isNone(fetchSite) && !ALLOWED_FETCH_SITES.has(fetchSite)) {
    return false;
  }
  const origin = getHeader('origin');
  if (type.isNone(origin) || origin === '') {
    return allowNoOrigin;
  }
  const host = getHeader('host');
  return !type.isNone(host) && getOriginHost(origin) === host;
}

export default isSameOriginRequest;
