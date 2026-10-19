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

// URL.origin lowercases the host and drops a default port, so
// `https://App.test:443` and `https://app.test` compare equal.
function normaliseOrigin(value) {
  try {
    const { origin } = new URL(value);
    return origin === 'null' ? null : origin;
  } catch {
    return null;
  }
}

// A Host header names the host and port only; the scheme is the Origin's.
function hostOrigin({ host, scheme }) {
  if (type.isNone(host) || host.trim() === '') {
    return null;
  }
  return normaliseOrigin(`${scheme}//${host.trim()}`);
}

// A proxy chain appends to X-Forwarded-Host; the first entry is the host the
// browser asked for.
function firstForwardedHost(value) {
  if (type.isNone(value)) {
    return null;
  }
  return value.split(',')[0];
}

// The one rule every server applies to routes only the app's own pages call:
// the cookie-bearing browser routes and websocket upgrades. Sec-Fetch-Site and
// Origin are set by the browser and cannot be set by page script.
// Sec-Fetch-Site `cross-site` and `same-site` are refused. The Origin must then
// be the one the request arrived on: the Host header, and where the caller
// allows them, the first X-Forwarded-Host (for a proxy that rewrites Host) or
// one of the app's configured public origins.
//
// A caller that sends no Origin is not a browser acting for another site - a
// server, curl, an agent. It passes only where the route allows it.
function isSameOriginRequest({
  getHeader,
  allowNoOrigin = false,
  acceptForwardedHost = false,
  publicOrigins = [],
}) {
  const fetchSite = getHeader('sec-fetch-site');
  if (!type.isNone(fetchSite) && !ALLOWED_FETCH_SITES.has(fetchSite)) {
    return false;
  }
  const rawOrigin = getHeader('origin');
  if (type.isNone(rawOrigin) || rawOrigin === '') {
    return allowNoOrigin;
  }
  const origin = normaliseOrigin(rawOrigin);
  if (origin === null) {
    return false;
  }
  const { protocol: scheme } = new URL(origin);
  const hosts = [getHeader('host')];
  if (acceptForwardedHost) {
    hosts.push(firstForwardedHost(getHeader('x-forwarded-host')));
  }
  if (hosts.some((host) => hostOrigin({ host, scheme }) === origin)) {
    return true;
  }
  return publicOrigins.some((publicOrigin) => normaliseOrigin(publicOrigin) === origin);
}

export default isSameOriginRequest;
