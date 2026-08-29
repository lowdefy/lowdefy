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

import { getAsIssuer, getMcpResourceUri, MCP_OAUTH_SCOPES } from '@lowdefy/api';

import lowdefyConfig from '../../lib/build/config.js';

// RFC 9728 protected-resource metadata for the MCP endpoint. Constant per
// deployment: the URIs derive from the pinned BETTER_AUTH_URL, never a Host
// header. The organization a token acts in is not part of the resource - it is
// chosen at authorization and carried as a token claim.
function mcpProtectedResourceMetadataHandler(c) {
  return c.json({
    resource: getMcpResourceUri({ config: lowdefyConfig }),
    authorization_servers: [getAsIssuer({ config: lowdefyConfig })],
    scopes_supported: MCP_OAUTH_SCOPES,
    bearer_methods_supported: ['header'],
  });
}

export default mcpProtectedResourceMetadataHandler;
