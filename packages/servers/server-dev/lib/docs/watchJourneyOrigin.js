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

// The data cookie is set for the journey's origin only, so a request to the dev server's port on
// another host (127.0.0.1 against localhost, [::1], a LAN address) would carry none and read the
// real database as a signed-out caller. The browser's host resolver rules (hostResolverRules.js)
// stop every such request before it leaves the browser; this hands each attempt to onLeave, so the
// journey fails at the step that made it. A listener, not a route: any Playwright route turns the
// context's HTTP cache off. Requests to other ports and other sites are untouched.
function watchJourneyOrigin({ context, origin, onLeave }) {
  const originUrl = new URL(origin);
  const port = originPort({ url: originUrl });
  context.on('request', (request) => {
    const url = new URL(request.url());
    if (originPort({ url }) === port && url.hostname !== originUrl.hostname) {
      onLeave(request.url());
    }
  });
}

export default watchJourneyOrigin;
