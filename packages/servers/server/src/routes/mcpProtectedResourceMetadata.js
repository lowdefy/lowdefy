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

import { getAsIssuer, getMcpResourceUri, isWellFormedOrgSegment } from '@lowdefy/api';

import lowdefyConfig from '../../lib/build/config.js';

// RFC 9728 protected-resource metadata for an org's MCP endpoint. Every field
// is constant except the echoed org segment - deliberately no organization
// lookup, so a fabricated org id gets the same-shaped document and the public
// route is no existence oracle. The URIs derive from the pinned
// BETTER_AUTH_URL, never a Host header.
function mcpProtectedResourceMetadataHandler(c) {
  const orgId = c.req.param('org');
  if (!isWellFormedOrgSegment(orgId)) {
    return c.json({ error: 'Not found.' }, 404);
  }
  return c.json({
    resource: getMcpResourceUri({ config: lowdefyConfig, orgId }),
    authorization_servers: [getAsIssuer({ config: lowdefyConfig })],
    scopes_supported: ['mcp:read', 'mcp:write'],
    bearer_methods_supported: ['header'],
  });
}

export default mcpProtectedResourceMetadataHandler;
