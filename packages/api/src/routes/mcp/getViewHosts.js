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

import { createHash } from 'node:crypto';

import { getMcpResourceUri } from './getMcpUri.js';

// The hosts this app serves MCP App views to. Each entry gives the domain
// value sent to that host in a view's metadata and the origin its views run
// on. Everything that admits a view's origin - CORS, the websocket origin
// check, the client error route - checks against this list, so a second host
// is added here and nowhere else.
//
// One entry, Claude. It renders a connector's views on an origin it computes
// from the connector's URL: the first 32 hex characters of the URL's SHA-256,
// under claudemcpcontent.com. It refuses to render when the domain the server
// sends differs, so the hash is of the canonical MCP resource URI, which never
// ends in a slash - the URL the connector must be added with.
//
// [] when the app's canonical origin is not pinned: the origin cannot be
// computed, and such an app has no views.
function getViewHosts({ config }) {
  const resourceUri = getMcpResourceUri({ config });
  if (resourceUri === null) {
    return [];
  }
  const hash = createHash('sha256').update(resourceUri).digest('hex').slice(0, 32);
  const domain = `${hash}.claudemcpcontent.com`;
  return [{ id: 'claude', domain, origin: `https://${domain}` }];
}

export default getViewHosts;
