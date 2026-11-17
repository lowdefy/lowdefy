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

import originPort from './originPort.js';

// Chromium's --host-resolver-rules for a browser that serves one origin: every host on the
// origin's port but the origin's own fails to resolve, so a request to the dev server under another
// host (127.0.0.1 against localhost, [::1], a LAN address) never leaves the browser. Chromium
// matches a MAP pattern against host:port, IP literals included, and an EXCLUDE against the bare
// host, so an IPv6 origin is named without its brackets. Unlike a Playwright route, the rule keeps
// the browser's HTTP cache, so a journey's later page loads reuse the dependency chunks.
function hostResolverRules({ origin }) {
  const url = new URL(origin);
  const host = url.hostname.replace(/^\[(.*)\]$/, '$1');
  return `MAP *:${originPort(url)} ~NOTFOUND, EXCLUDE ${host}`;
}

export default hostResolverRules;
