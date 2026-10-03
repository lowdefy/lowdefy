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

const LOOPBACK_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]']);

// The auth canonical origin for this dev server. BetterAuth trusts only that
// origin (the CSRF Origin check, callbackURL targets) and builds magic-link and
// verification links from it. A developer's BETTER_AUTH_URL usually names the
// port they ran on before - http://localhost:3000 - but the dev server's port
// is chosen at start (the hub allocates one, a busy port is skipped), and a
// loopback origin on another port refuses every sign-in from the page this
// server serves with "Invalid origin". So a plain-http loopback BETTER_AUTH_URL
// with an explicit port follows the dev server's port.
//
// Everything else is the developer's deliberate choice and is kept: a tunnel or
// LAN host, and a loopback origin the dev server cannot be serving itself - an
// https one (it speaks plain http) or one on the default port (80 needs root),
// which is a local reverse proxy (Caddy, mkcert) in front of it. An unset one
// stays unset: the dev server then derives the origin from each request.
//
// Returns the origin to use and whether it was rewritten, so the caller reports
// a rewrite and not a mere difference in whitespace.
function resolveDevAuthUrl({ configured, port }) {
  const value = configured?.trim();
  if (!value) return { authUrl: value, rewritten: false };
  let url;
  try {
    url = new URL(value);
  } catch {
    return { authUrl: value, rewritten: false };
  }
  if (
    !LOOPBACK_HOSTNAMES.has(url.hostname) ||
    url.protocol !== 'http:' ||
    url.port === '' ||
    url.port === String(port)
  ) {
    return { authUrl: value, rewritten: false };
  }
  url.port = String(port);
  const authUrl = url.pathname === '/' ? url.origin : `${url.origin}${url.pathname}`;
  return { authUrl, rewritten: true };
}

export default resolveDevAuthUrl;
