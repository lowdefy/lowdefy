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

const DEFAULT_PORTS = { 'http:': '80', 'https:': '443' };

function portOf(url) {
  return url.port === '' ? DEFAULT_PORTS[url.protocol] : url.port;
}

// The data cookie is set for the journey's origin only, so a request to the dev server's port on
// another host (127.0.0.1 against localhost, [::1], a LAN address) would carry none and read the
// real database as a signed-out caller. Such requests are aborted before they leave the browser and
// handed to onLeave; requests to other ports and other sites are untouched.
async function guardJourneyOrigin({ context, origin, onLeave }) {
  const originUrl = new URL(origin);
  const originPort = portOf(originUrl);
  await context.route(
    (url) => portOf(url) === originPort && url.hostname !== originUrl.hostname,
    async (route) => {
      onLeave(route.request().url());
      await route.abort('blockedbyclient');
    }
  );
}

export default guardJourneyOrigin;
